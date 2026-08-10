// Which service area /fare-estimate prices (wayfinder #62, resolution added by
// #73).
//
// It lives here rather than in `./fareEstimate` for one mechanical reason: the
// page has to NAME this area in its markup, and `./fareEstimate` imports
// `./firebase`, which calls `initializeApp` at module scope. Importing it from
// Astro frontmatter would run Firebase initialisation during the static build
// to read a string constant. This module still has NO imports at all — keep it
// that way, and see `ResolvableArea` below for why the input type is declared
// here rather than imported from `./feeSchedule`.

/**
 * The area asked for when the site cannot work out which one applies.
 *
 * Before #73 this was the answer on every call, whatever the rider typed. It is
 * now the FALLBACK and nothing more: it is used when no area publishes a usable
 * circle, and when the area list cannot be fetched at all. Both of those mean
 * *the site cannot tell*, which is the state the page was permanently in before
 * yeapptech/yeride-functions#45 published each area's geography — so the page
 * degrades to exactly what #62 shipped, naming the area it priced, rather than
 * to a silent unlabelled quote.
 *
 * It is deliberately NOT used to mean "outside": see `resolveServiceArea`.
 */
export const DEFAULT_SERVICE_AREA_ID = "us-fl-south-florida";

/** A WGS-84 point. Matches `getFeeSchedule`'s `center` and Google's `LatLng`. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * The minimum an area must carry to be resolvable.
 *
 * Declared here as a STRUCTURAL requirement rather than imported from
 * `./feeSchedule`, for two reasons. This module keeps its no-imports property
 * (see the file header). And a resolver that states its own minimum can be
 * exercised against fixtures without dragging in the endpoint's whole contract
 * — which is what `scripts/service-area.test.mjs` does. `ServiceAreaRef` is
 * assignable to this, and `astro check` fails if it ever stops being.
 *
 * `center`/`radiusMeters` are optional because the endpoint OMITS them for an
 * area whose stored circle is absent or unusable — an absent KEY, never a null
 * or a zero (yeride-functions#45 acceptance rule 1). A defaulted `0` radius
 * would silently mean nobody is ever inside; a defaulted large one that
 * everybody always is. Both are the $0.00-masking-a-gap failure this site
 * refuses, on the surface that decides whether a rider is quoted at all.
 */
export interface ResolvableArea {
  id: string;
  center?: GeoPoint | null;
  radiusMeters?: number | null;
}

/**
 * What the site can honestly say about where the rider is.
 *
 * Three outcomes, not two, and the third is the point. "Not inside any circle I
 * can see" is NOT the same claim as "outside our service areas", and collapsing
 * them would put §3.5's "We're not in that area yet." on screen off missing
 * data — the false-sentence failure #62 refused to ship the row over.
 */
export type AreaResolution =
  /** The pickup is inside this area's published circle. */
  | { kind: "inside"; areaId: string }
  /** Every area published a usable circle and none of them contains the pickup. */
  | { kind: "outside" }
  /** The site cannot tell — no list, or an area whose circle is missing. */
  | { kind: "unknown" };

/**
 * Mirrors yeride-mobile's `Coordinates.distanceTo` EXACTLY — same
 * `6_371_000` earth radius, same `atan2` form — and not by coincidence.
 *
 * 🔴 The two programs answer the same question about the same documents. If
 * they used different constants or a different formula they would disagree
 * within metres of a boundary, and one rider would be told the app serves them
 * while the site says it does not. Whatever this changes, change
 * `src/domain/entities/Coordinates.ts` with it.
 */
function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const EARTH_RADIUS_METERS = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);
  const h =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** A point that is not a real place cannot be resolved against anything. */
function isPoint(p: GeoPoint | null | undefined): p is GeoPoint {
  return (
    !!p &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lng >= -180 &&
    p.lng <= 180
  );
}

/**
 * The area's circle, or `null` when it does not have a usable one.
 *
 * Deliberately NOT bounded above or below here, though both yeride-mobile and
 * `getFeeSchedule` bound it. A third opinion about the same number is how two
 * programs come to disagree about one document — the failure the shared
 * Haversine above exists to prevent — so an implausible radius is upstream's to
 * refuse, and it is refused twice already. (Worth knowing that those two bounds
 * are not currently equal: `getFeeSchedule` and the mobile DTO both allow
 * `0 < r <= 20_000_000`, but mobile's `ServiceArea.create` then narrows it to
 * `[100, 5_000_000]`. Raised on #73; it changes nothing at today's radii.)
 */
function circleOf(
  area: ResolvableArea,
): { center: GeoPoint; radiusMeters: number } | null {
  const { center, radiusMeters } = area;
  if (!isPoint(center)) return null;
  if (typeof radiusMeters !== "number") return null;
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return null;
  return { center, radiusMeters };
}

/**
 * Resolve the rider's pickup to the service area that should price the trip.
 *
 * Semantics are yeride-mobile's `ResolveActiveServiceArea`, not a second model:
 * Haversine, **inclusive at the boundary**, and on overlap the **first match in
 * document-id order** wins (a city-level area nested inside a regional one).
 *
 * 🔴 The ordering is reproduced here by sorting, rather than trusted from the
 * wire. `readAreas` does sort by id ascending and yeride-functions#45 asked
 * consumers not to re-sort — this obeys the spirit of that by arriving at the
 * SAME order independently, so the tie-break stays deterministic even if a
 * future endpoint, proxy or cache reorders the array. Sorting to the identical
 * order cannot change an answer; depending on someone else's sort can.
 *
 * 🔴 "outside" REQUIRES every area to publish a usable circle. This is the
 * whole honesty rule of the function. An area with no circle might well contain
 * the rider — nothing here can know — so as long as one is unreadable the only
 * true answer is `unknown`, and the page falls back to naming the area it
 * priced. Reporting `outside` on a partial list would tell a rider YeRide does
 * not serve them on the strength of a field an admin forgot to fill in.
 */
export function resolveServiceArea(
  pickup: GeoPoint | null | undefined,
  areas: readonly ResolvableArea[] | null | undefined,
): AreaResolution {
  if (!isPoint(pickup)) return { kind: "unknown" };
  if (!areas || areas.length === 0) return { kind: "unknown" };

  const ordered = [...areas].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  let everyAreaReadable = true;
  for (const area of ordered) {
    const circle = circleOf(area);
    if (!circle) {
      everyAreaReadable = false;
      continue;
    }
    if (distanceMeters(circle.center, pickup) <= circle.radiusMeters) {
      return { kind: "inside", areaId: area.id };
    }
  }

  return everyAreaReadable ? { kind: "outside" } : { kind: "unknown" };
}
