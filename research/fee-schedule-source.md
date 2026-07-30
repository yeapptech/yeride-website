# Research: where does the meter's rate card live, and how can /fees read it?

Resolves [yeapptech/yeride-website#31](https://github.com/yeapptech/yeride-website/issues/31) (wayfinder map #30).

Sources: local clone of `yeride-functions` (read-only) at commit state of 2026-07-30, plus this repo's `src/lib/fareEstimate.ts` / `src/lib/firebase.ts`. Paths below are repo-relative; `yeride-functions` is JavaScript (CommonJS, Node 22).

## 1. Where the rate card physically lives

**Entirely in the production database. No config file, no Remote Config, no env vars, no hardcoded rate constants anywhere in the repo — the actual amounts are not visible in any codebase.**

- Per-tier base fare, per-km, per-minute, and minimum fare live as rate fields on the per-service-area ride-service documents; the fare formula (`functions/lib/fare-utils.js`) is `fare = baseFare + (meters/1000)*costPerKm + minutes*costPerMinute`, floored at `minimumFare`. It is **per-km, not per-mile** — miles appear only as display math.
- "Booking fee", "dispatch fee", "per-minute platform fee", "trip-insurance rider/driver shares", and "card processing rate" are **not named in code at all**. Each is a per-service-area app-charge document holding an `id`, a `description`, and a **JSONata formula string** evaluated against the trip object. Only stale doc examples of amounts exist in the repo's own docs.
- `us-fl-south-florida` is hardcoded only as a fallback default service area.
- **No seed script.** Nothing in the repo writes the rate or charge documents; they are administered out-of-repo by `yeride-admin-api`. Production data is the sole, unversioned source of truth.

## 2. Is there an existing public, unauthenticated read?

**No.** `estimateFares` (the callable the fare-estimate page already uses, region `us-east1`) is publicly invokable by design, but it is not a fee-schedule endpoint: it returns *computed totals* for one synthetic `(distance, duration)` — never the underlying rate fields or charge formulas. Reverse-engineering rates from probe calls is fragile, and any charge whose expression references real-trip fields evaluates to `0` in the synthetic context, so those fees are invisible to probing. No other existing path serves the raw schedule to an unauthenticated web page, and there is no Firebase Hosting in front of the functions (the site is GitHub Pages), so no rewrites are possible.

## 3. Smallest new read-only endpoint

**One new public `onRequest` HTTP function in `yeride-functions` (≈40 lines), e.g. `getFeeSchedule`.** New backend work is required; nothing existing suffices.

- Reads the exact same data `estimateFares` reads (two reads: the ride-service rate docs and the app-charge docs for a service area) and returns them raw: rate fields verbatim per tier, and for each app charge its `id`, `description`, and either the formula string or a server-rendered human-readable form. Because many fees are formulas, the /fees page must render *formulas/descriptions*, not assume fixed dollar amounts.
- `serviceAreaId` via query param, defaulting to `us-fl-south-florida` to match the website.
- **CORS:** explicit origins — `["https://www.yeride.com", "https://yeride.com", "http://localhost:4321"]`. The website is static GitHub Pages, so this is a plain browser `fetch` — no Firebase SDK needed.
- **Caching:** no CDN/hosting sits in front of the function, so `Cache-Control` only drives browser caching. `public, max-age=300` is a sane bound: today *nothing* in the system caches pricing, so any TTL is the first staleness window introduced — keep it short. The /fees page should also render a "fetched live" timestamp.
- Alternatives rejected: **direct client database reads** (couples /fees to a client-rules posture that is being hardened separately — don't) and a **hosting rewrite** (no Firebase Hosting exists).

## 4. Drift risks between `estimateFares` and a fee endpoint

1. **Formula-vs-context drift (exists today, structural):** estimates evaluate app charges against a synthetic trip; real charging evaluates against a full trip. Expressions referencing real-trip fields silently evaluate to `0` in estimates but a real amount at charge time — a built-in under-quote. A fee endpoint returning raw expressions sidesteps this; one that "evaluates" charges would inherit it.
2. **Two divergent charge-evaluation code paths already exist** in `fare-utils.js` with different error handling (one aborts all remaining charges on a bad expression; the other skips only the broken one). The endpoint should return raw docs and avoid becoming a third evaluator.
3. **Silent zeros:** the estimate path coalesces missing rate fields to `0`, so a misnamed field quotes $0. The endpoint should return fields verbatim so a broken doc is *visible* on /fees rather than masked.
4. **Caching:** any endpoint/browser TTL is the system's first pricing-staleness window (see §3).
5. **Unversioned source of truth:** no seed script, no fixtures, no diff/review trail for rate changes; write-protection of the pricing documents is being tightened in a separately tracked effort. Until then, "what the meter charges" is whatever the database says at that instant — which the live-fetch design of /fees at least reflects faithfully.
6. **Docs drift precedent:** the repo's own docs name a collection that the code doesn't read. Build the endpoint from code, not docs.

## Recommendation for the /fees build ticket

- **Backend (yeride-functions): required.** Add one public read-only `onRequest getFeeSchedule` (us-east1) returning the ride-service rate docs + app-charge docs verbatim, CORS-allowing `https://www.yeride.com`, `Cache-Control: public, max-age=300`.
- **Frontend:** plain `fetch` at page load (no Firebase SDK needed), render per-tier base/per-km(per-mile-converted)/per-minute/minimum rates plus the app-charge list from `description` + formula; show a live-fetched timestamp. Remember backend rates are **per km** — convert for display.
- Single source of truth holds: both the meter and /fees read the same documents at request time.
