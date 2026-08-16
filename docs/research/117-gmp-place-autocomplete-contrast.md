# `gmp-place-autocomplete`: the documented styling surface, and what it says about SC 1.4.11

Research notes for [#117](https://github.com/yeapptech/yeride-website/issues/117).
Every claim below is followed by the source that owns it.

Two halves, gathered separately and deliberately kept apart in this document so each can
be checked on its own terms:

- **Sections A and B — the documented surface.** Desk research against Google's primary
  sources. No runtime observation informs them; where the docs are silent, that silence is
  written as the finding rather than filled in with a guess.
- **Section C — the runtime measurement.** Taken in a browser against production. This is
  the half #117 said nobody had done.

The halves overlap in exactly one narrow place, and the overlap is worth stating precisely
rather than generously: C4's probe found **no undocumented part** reachable by a guessable
name. It did **not** confirm A2's list — only two of A2's ten documented parts were probed
at all. See C4 for what the probe does and does not establish.

Sources were read on 2026-08-15. Google's reference and guide pages carry a
"Last updated 2026-08-11 UTC" stamp and are versionless URLs — they document whatever
the weekly channel currently is, so a future reader should re-check rather than trust
the quotes below to still be current.

## The question

`/fare-estimate` renders its pickup and dropoff fields as `PlaceAutocompleteElement`
(`<gmp-place-autocomplete>`), which draws its own field inside shadow DOM. WCAG 2.2
SC 1.4.11 Non-text Contrast asks for 3:1 between a UI component's boundary and adjacent
colour; the adjacent colour here is the card ground `#FBF8F3` (`bg-paper`).

Two things had to be established from documentation:

- **A.** Is the boundary reachable from outside the shadow root, and is the mechanism a
  *documented contract* or merely something observable in today's shipped DOM?
- **B.** Does Google publish the drawn value, and does Google publish any accessibility
  or contrast conformance claim for this element?

### The criterion, verbatim

> The visual presentation of the following have a contrast ratio of at least 3:1 against
> adjacent color(s): **User Interface Components** — Visual information required to
> identify user interface components and states, except for inactive components or where
> the appearance of the component is **determined by the user agent and not modified by
> the author**; …

— W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*, SC 1.4.11 Non-text Contrast,
<https://www.w3.org/TR/WCAG22/#non-text-contrast>

**Neither exception applies, and since the whole finding rests on that, it is argued rather
than asserted.**

*"Determined by the user agent and not modified by the author."* The exception covers a
control the browser draws for itself — an unstyled native `<input>`, whose appearance the
author never touched. This element is out of it on the **first** clause alone: the boundary
is painted by **Google's script**, which is author-supplied third-party content shipped by
this site, not by Chrome's default rendering. Nothing here is UA chrome. The exception exists
so authors are not liable for appearance they cannot control; here the appearance is
controllable — C5 demonstrates it — so the rationale does not reach either.

An earlier draft added a second reason, that this repo already modifies the element by
setting `color-scheme` and `placeholder`. That is **dropped as unsound**: the test asks
whether the appearance is *determined by the UA*, and having styled some other property of
the element does not bear on it. One correct reason is worth more than two where the second
argues against the first.

*"Inactive components."* A disabled control is exempt. These fields are enabled and are the
page's primary input — a rider cannot get an estimate without typing into them. The leg does
not apply on its face.

W3C's Understanding document for the criterion is the authority on both legs and was not
consulted for this note; the reading above is from the normative text quoted here. If the
build ticket turns on the exception, read Understanding SC 1.4.11 before relying on it.

## What this repo actually loads

- `src/components/FareEstimatePage.astro` imports `setOptions` / `importLibrary` from
  `@googlemaps/js-api-loader`; `package.json` pins `^2.0.2`, and `package-lock.json`
  resolves 2.0.2.
- That file's sole `setOptions` call is the only one in `src/`. It
  passes `key`, `language` and `region` — **no `v`**. The loader turns each option into a
  query parameter on `https://maps.googleapis.com/maps/api/js?…` (verified in
  `node_modules/@googlemaps/js-api-loader/dist/index.cjs`), so the bootstrap request
  carries no `v` at all.
- Therefore the site loads the **weekly channel**:

  > "If you do not explicitly specify a channel or version, you will receive the weekly
  > channel by default."
  > … "Currently, the weekly channel is version 3.65."
  > … "In mid-August, the weekly channel will be updated to version 3.66. At that time,
  > the new version may remove deprecated features, and/or introduce
  > backwards-incompatibilities."

  — <https://developers.google.com/maps/documentation/javascript/versions>

  The release notes' latest weekly entry at time of reading is **3.65.12f, 6 August 2026**;
  the quarterly channel is **3.64.12d, 6 May 2026**
  (<https://developers.google.com/maps/documentation/javascript/releases>).

  **Note the timing.** This repo is on the channel that rolls to 3.66 "in mid-August"
  — i.e. within days of these notes — on Google's own warning that a channel roll "may
  remove deprecated features, and/or introduce backwards-incompatibilities."

- `@types/google.maps` in the lockfile is **3.58.1** (transitive; not a direct dependency).
  That predates several of the properties and parts below, which is the mundane reason
  `dressAutocomplete` casts to `any` to set `placeholder` — `placeholder` was added in
  3.63.9d, 8 January 2026 (release notes). The types lagging the API is a fact about the
  types package, not about the element.

---

## A. Is the boundary reachable from outside the shadow root?

**Yes, and by a documented contract — not merely by an observable part.** Two independent
documented routes exist.

### A1. `border` is a documented CSS property of the element itself

The Places Widgets reference lists, under `PlaceAutocompleteElement` (between its `Parts`
section and its `Methods` section), a **CSS Properties** block:

> **CSS Properties**
> `background-color` — Overrides the background color of the element.
> `border` — Overrides the border of the element.
> `border-radius` — Overrides the border radius of the element.
> `color` — Overrides the font of the element.
> `color-scheme` — Indicates which color scheme this element can be rendered in. See
> color-scheme documentation for more details. **Defaults to `color-scheme: light dark`.**
> `font`, `font-family`, `font-size`, `font-style`, `font-weight`, `line-height` —
> Overrides the font of the element.

— <https://developers.google.com/maps/documentation/javascript/reference/places-widget>
(section `PlaceAutocompleteElement`; the same block repeats separately for
`BasicPlaceAutocompleteElement`)

This is a published API-reference entry for the class, in the same document as its
properties, events and methods. It is a contract in the same sense the rest of that page is.

Its arrival is dated in the changelog:

> **3.61.9a — 10 July, 2025:** "Enable border, border radius, widget background color and
> color scheme customization support for Place Autocomplete Element. The Place Autocomplete
> Element now automatically respects dark mode - to disable, apply `color-scheme: light` in
> CSS."

— <https://developers.google.com/maps/documentation/javascript/releases>

So writing `border: <something>` on the `gmp-place-autocomplete` host is a documented,
supported override of the field's border — not a hack, and not dependent on reaching into
the shadow root.

### A2. `::part(input)` is a documented shadow part

The same reference section lists, for `PlaceAutocompleteElement`:

> **Parts**
> `focus-ring` — The element used to display the focus ring around the focused element
> (input or prediction-items)
> `input` — The input element for the autocomplete element.
> `prediction-item` — An item in the drop down of predictions that represents a single
> prediction.
> `prediction-item-icon` — The icon displayed to the left of each item in the list of
> predictions.
> `prediction-item-main-text` — … By default, the prediction-item-main-text is colored
> black. … It is colored gray by default. …
> `prediction-item-match` — … By default, this matched text is highlighted in bold text. …
> `prediction-item-nonmatch` — The part of the prediction main text that does not match
> the user's input.
> `prediction-item-secondary-text` — A part of prediction-item that is the secondary text
> of the prediction. …
> `prediction-item-selected` — The item when the user navigates to it via the keyboard. …
> `prediction-list` — The visual element containing the list of predictions …

— <https://developers.google.com/maps/documentation/javascript/reference/places-widget>

And in the changelog:

> **3.63.9d — 8 January, 2026:** "Added CSS Part `input` to the `PlaceAutocompleteElement`"
> **3.64.11d — 29 April, 2026:** "Added `focus-ring` as CSS Shadow Part in both
> PlaceAutocompleteElement and BasicPlaceAutocompleteElement."
> **3.65.1c — 20 May, 2026:** "Exposed `prediction-item-secondary-text` and
> `prediction-item-nonmatch` shadow parts for both BasicPlaceAutocomplete and
> PlaceAutocomplete prediction items, enabling custom styling for unmatched main text and
> secondary text."

— <https://developers.google.com/maps/documentation/javascript/releases>

Also documented, same reference section — **Slots**: `clear-icon`, `input-icon`,
`prediction-item-icon` (`input-icon` and `clear-icon` added in 3.65.1c, 20 May 2026).

**Contract vs. observable — the distinction #117 asks for.** These parts are enumerated in
Google's own API reference *and* announced individually in the changelog as additions. That
is the strongest form of contract Google gives for any of this element's surface. It is
weaker than a versioned semver promise: nothing in Google's docs states a deprecation policy
for a shadow part, and the channel this site loads is explicitly allowed to introduce
backwards-incompatible changes at each quarterly roll (see the versions quote above). But
"documented and changelogged" is materially different from "found by poking at the shadow
root", and both `border` and `::part(input)` are in the former category.

### A3. What is NOT documented for this element

The `--gmp-mat-*` custom-property system does **not** apply to autocomplete.

The "CSS properties to customize Places UI Kit" page carries a table whose **only two
columns are "Details Compact Element" and "Details Element"**. Every `--gmp-mat-color-*`
and `--gmp-mat-font-*` property, and the `border` / `border-radius` "Container (component)"
rows, are ticked for those two elements and no others. No autocomplete column exists on that
page. In particular `--gmp-mat-color-outline-decorative` ("Container border") is a
Details-element property there, not an autocomplete one.

— <https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling>

Likewise the Places Widgets reference lists `--gmp-button-border-color`,
`--gmp-button-border-width`, `--gmp-collage-border-radius-outer`,
`--gmp-dialog-border-radius` etc. under `PlaceDetailsElement` /
`PlaceDetailsCompactElement` / `PlaceSearchElement` — **not** under
`PlaceAutocompleteElement`, whose CSS-property list is exactly the eleven names quoted in
A1 (`background-color`, `border`, `border-radius`, `color`, `color-scheme`, and the six
font properties).

The prose guide "Place Autocomplete Widget"
(<https://developers.google.com/maps/documentation/javascript/place-autocomplete-new>) has
**no styling section at all**. Its samples style only layout (`width`, card `box-shadow`).
So the reference page is the whole documented styling contract for this element.

The "Customization tool" page is Details-only:

> "Use the Customization tool to visualize how different sets of properties will affect the
> appearance of a **Places Details element**."

— <https://developers.google.com/maps/documentation/javascript/places-ui-kit/customization-tool>

---

## B. What Google draws, and what it claims

### B1. The default border colour and width are NOT published

**Finding: not documented anywhere in Google's reference, guides, changelog or samples.
It is observable only at runtime.**

Searched and came up empty:

- the `PlaceAutocompleteElement` reference section — documents `border` as an *override*
  ("Overrides the border of the element") and never states the default value
  (<https://developers.google.com/maps/documentation/javascript/reference/places-widget>);
- the custom-styling page — no autocomplete column at all, and no default hex values for
  anything (<https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling>);
- the Place Autocomplete Widget guide — no styling section
  (<https://developers.google.com/maps/documentation/javascript/place-autocomplete-new>);
- the customization tool — Details elements only.

The docs *do* publish defaults for some neighbouring things, which is what makes the
omission legible rather than an oversight in the search: the reference states
`prediction-item-main-text` "is colored black" by default and additional text "is colored
gray by default", and states `color-scheme` "Defaults to `color-scheme: light dark`". It
publishes no equivalent sentence for the border.

No number for the default border may be stated unless it came from the browser. One now
has: see C1, which found there is no border to put a number on.

### B2. No WCAG or contrast conformance claim exists for this element

**Finding: Google publishes no WCAG conformance claim, and no contrast statement, for
`PlaceAutocompleteElement` or the Places UI Kit.**

The only accessibility claims found for this element are qualitative feature claims:

> "Enhanced accessibility, including support for screen readers and keyboard interaction."

— <https://developers.google.com/maps/documentation/javascript/place-autocomplete-new>
("What's new")

and, in the changelog, 3.64.11d (29 April 2026): "Added a 'description' property to both
PlaceAutocompleteElement and BasicPlaceAutocompleteElement to provide additional context for
screen reader users." Neither mentions contrast, non-text contrast, a conformance level, or
SC 1.4.11.

Google Cloud's own accessibility blog post for the Maps JavaScript API
(<https://mapsplatform.google.com/resources/blog/latest-accessibility-updates-maps-javascript-api>,
published 21 June 2022, i.e. years before this element shipped) covers tab order, keyboard
navigation, screen reader support and high-contrast-mode visibility, and states no WCAG
conformance level and no contrast ratio.

Google Cloud publishes VPATs at <https://cloud.google.com/security/compliance/vpat>, but no
VPAT specific to the Maps JavaScript API or the Places UI Kit was located from Google's own
pages. **Marked unresolved** — see the open section.

### B3. `color-scheme` IS a documented input to theming

Yes, in three places:

> `color-scheme` — "Indicates which color scheme this element can be rendered in. See
> color-scheme documentation for more details. **Defaults to `color-scheme: light dark`**."

— <https://developers.google.com/maps/documentation/javascript/reference/places-widget>
(`PlaceAutocompleteElement` CSS Properties)

> "By default, Places UI Kit components automatically adapt to the user's preferred color
> scheme, detecting whether the user has their browser or system set to light or dark mode.
> … If your application uses a single, fixed theme, the automatic theme switching can lead
> to a poor user experience. For example, a dark-themed component might appear in your
> light-themed app. To prevent this, you can force the component to always render in a
> specific theme by setting `color-scheme` in CSS."

— <https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling>

> **3.61.9a — 10 July, 2025:** "… The Place Autocomplete Element now automatically respects
> dark mode - to disable, apply `color-scheme: light` in CSS."

— <https://developers.google.com/maps/documentation/javascript/releases>

This vindicates `dressAutocomplete`'s `element.style.colorScheme = "light"`
(in `dressAutocomplete`, `src/components/FareEstimatePage.astro`) as the documented
mechanism, and Google's own
Basic Place Autocomplete sample uses `color-scheme: light;` in exactly that way
(<https://developers.google.com/maps/documentation/javascript/places-ui-kit/basic-autocomplete>).
It also means whatever border is measured must be measured **in the light scheme**, since
the drawn value is scheme-dependent by design.

### B4. GA vs. pre-GA — the two autocomplete elements are not in the same state

This matters and is easy to get backwards.

- **`PlaceAutocompleteElement` (`<gmp-place-autocomplete>`) — what this repo uses.**
  Documented under "Place Autocomplete", not under "Places UI Kit". Neither its guide page
  nor its reference section carries any pre-GA, Experimental, Preview or beta banner (the
  same reference page *does* label other things, e.g. the nav lists "Address Validation
  (beta)"). It reached the stable channel on **3.60.7b, 3 April 2025**: "The Place
  Autocomplete Widget is now available in the weekly channel."
  (<https://developers.google.com/maps/documentation/javascript/releases>). Its earlier
  preview life is visible in the same changelog — 3.55.11a, 15 February 2024:
  "[beta channel] PlaceAutocompleteElement is now available in Preview (v=beta)".

- **`BasicPlaceAutocompleteElement` (`<gmp-basic-place-autocomplete>`) — a different
  element, and pre-GA.** It is part of the Places UI Kit, whose overview page carries:

  > "This product or feature is currently in the **Experimental (pre-GA)** phase, which
  > means it has limited support and potential for incompatibility."

  — <https://developers.google.com/maps/documentation/javascript/places-ui-kit/overview>
  (which lists "Basic Place Autocomplete Element" among the Places UI Kit elements;
  it reached the weekly channel at 3.61.10d).

So: the element this site ships is the GA one. Any statement that "the autocomplete is
pre-GA" is about the *other* element.

**The stability guarantee, stated plainly.** There is no per-element DOM/styling stability
promise anywhere in these docs. What exists is the channel policy, quoted once under "What
this repo actually loads" above and not requoted here — the operative sentence being that
Google "may introduce backwards-incompatible changes when creating a new version."

The quarterly channel (`v=quarterly`, currently 3.64) is the documented way to buy
predictability; this repo pins nothing and so rides weekly.

---

## C. The runtime measurement

Taken in the main session against **production** `https://www.yeride.com/fare-estimate`
on 2026-08-15, Chrome, light scheme, Maps JS reporting `google.maps.version` =
**3.65.12f** — the same weekly build the release notes name as current above. Sampled
through the live DOM and confirmed by screenshot, not computed from the source.

### C1. There is no drawn border at all

The `gmp-place-autocomplete` host computes to:

| Property | Value |
|---|---|
| `border-top-width` | `0px` |
| `border-top-color` | `rgb(229, 231, 235)` (Tailwind preflight's default; inert at 0 width) |
| `background-color` | `rgb(255, 255, 255)` — `#FFFFFF` |
| `border-radius` | `3px` |
| `box-shadow` | `none` |

The nearest painting ancestor is `form.mt-8 … bg-paper …` at `rgb(251, 248, 243)` —
`#FBF8F3`, confirming the ground the issue assumed.

So the field is a **plain white rectangle on the cream card, with no border and no shadow**.
This inverts the issue's framing: #117 asks "what does Google ship there, and does it clear
3:1" on the assumption that there is a border to sample. There is not. The only visual
information identifying the component's boundary is the **fill change** from `#FBF8F3` to
`#FFFFFF`.

### C2. That boundary measures 1.06:1

`#FFFFFF` against `#FBF8F3` is **1.06:1**, against SC 1.4.11's required 3:1.

This is not a marginal failure of the kind [#76](https://github.com/yeapptech/yeride-website/issues/76)
and [#115](https://github.com/yeapptech/yeride-website/issues/115) dealt with — it is the
near-total absence of a boundary. Note the contrast with the rest of that work: #115's worst
own-markup case was `border-ink/20` at 1.50:1.

### C3. The shadow root is closed

`document.querySelector('gmp-place-autocomplete').shadowRoot` is **`null`** after the
element has fully initialised (polled for 20s). The root is closed, so **no JavaScript in
this repo can pierce it** — neither to measure the internals nor to restyle them. Everything
in section A's contract is therefore not merely the *documented* route but the *only* route.

**This is a re-confirmation, not a discovery, and the repo said so first.**
`dressAutocomplete`'s own doc comment in `src/components/FareEstimatePage.astro` already
records it — "`gmp-place-autocomplete` is a CLOSED custom element — checked in the browser:
no light-DOM children, no reachable `shadowRoot`" — and draws two further consequences this
measurement did not have to rediscover: nothing inside can be selected, and a `<label for>`
cannot bind to it, a custom element not being labelable. Cited rather than restated, since a
doc that restates an asserted file drifts from it.

This also means C1's values are host-level facts. What Google draws *inside* the closed root
cannot be read at all; what can be established is that nothing it draws produces a visible
boundary beyond the white fill, which the screenshot confirms.

### C4. `::part()` crosses the closed root, and only `input` exists

**Fifteen** candidate part names were probed under observation, in two passes with
high-visibility rules (`::part(X){border:4px solid red; background:lime}`, then
`::part(X){outline:6px solid <unique colour per name>}` to isolate which one matched).
Exactly **one** matched: **`input`**.

The fifteen, in full, so the negative result is attributable: `input`, `input-container`,
`container`, `text-input`, `prediction-list`, `widget`, `field`, `search`, `root`, `icon`,
`main`, `wrapper`, `box`, `textfield`, `form`. All fourteen but `input` matched nothing.

(An earlier draft said "eighteen". A third pass did list eighteen names, but it produced no
observation — the rules were applied and removed without a screenshot between them — so
those extra names are not evidence and are not counted here.)

**What this establishes, and what it does not.** An earlier draft claimed the probe
"independently corroborates section A2's documented Parts list: the parts that exist are the
ones Google publishes." **It does not, and the probe's own data says so.** Of A2's ten
documented parts, this list touches **two**: `input`, which matched, and `prediction-list`,
which **did not**. The other eight were never probed. So thirteen of the fifteen names carry
no information about A2 either way.

The likely reason `prediction-list` did not match is mundane — the predictions dropdown was
closed throughout, so the element it names had not been rendered — but that was **not
verified**, and it is recorded here as the probable explanation rather than the established
one. Anyone re-running this should type into the field first.

The supported claim is therefore the narrow one: **no undocumented container part is
reachable by a guessable name.** Thirteen plausible container-ish guesses — `input-container`,
`container`, `widget`, `field`, `root`, `wrapper`, `main`, `box`, `textfield`, `form`,
`text-input`, `search`, `icon` — all matched nothing, which is a real negative result about
the *shape of the surface*, and is the claim C6 and the summary table rest on. It is not a
confirmation of Google's list.

The probe does settle open question 3 below on the merits: `::part(input)` matches the
**inner text input only**, inset from the component and excluding the search icon, so styling
it draws the wrong rectangle for the component's boundary. It is the wrong lever here.

### C5. The host `border` reaches the visible boundary, and replaces rather than doubles

Applying `gmp-place-autocomplete { border: 1px solid rgba(42,33,26,0.6); border-radius: 8px }`
to the live page draws **one** clean box around the whole field — search icon included — with
no second inner box and no artefact at the corners. This resolves open question 2 in favour of
the reference's wording: the host `border` is the field's boundary, not an outer frame added
around an inner one. (There is nothing for it to double, per C1.)

The measured result is exactly the repo's own non-text step from #115:

| Boundary | Ratio | Clears 3:1 |
|---|---|---|
| `border-ink/60` on the field's white fill | **4.24:1** (4.25 — see below) | yes, comfortably |
| `border-ink/60` on the `bg-paper` card | **4.16:1** | yes, comfortably |

**The second decimal here is a convention, not a measurement, and the load-bearing claim
is the inequality.** `border-ink/60` on `#FFFFFF` is **4.2443** if the composite is rounded
to integer channels before luminance, and **4.2517** if it is carried continuously — 4.24
against 4.25. This gate rounds (`check-contrast.mjs`, in `composite`), so quoting 4.24
reproduces *the gate's own convention*; it is **not** an independent confirmation of #115's
published figure, and an earlier draft of this note wrongly claimed it as one. This is
CLAUDE.md's `border-paper/30` lesson in a second place: *the load-bearing claim is the
inequality*. Both grounds clear 3:1 under either convention, by ~1.2 **of ratio** (4.24 − 3.0
= 1.24; 4.16 − 3.0 = 1.16), so nothing here turns on the digit. (`1.06` and `4.16` are stable
either way.)

Rendered, it is visually indistinguishable from the pre-registration form's inputs.

### C6. What this changes about the issue

All three of #117's "why it is not obvious" points move:

1. *"It may already pass."* It does not — 1.06:1, and for a different reason than expected.
2. *"Reachability is a second question with its own cost."* The cost is low. Google documents
   the host `border` override (A1) and the runtime confirms it works (C5). No shadow parts,
   no wrapper element, no coupling to Google's internal DOM — the same category of move as
   the `color-scheme: light` line already in `dressAutocomplete`.
3. *"It is not obviously this map's problem."* This weakens, but **only on ownership, and
   not on enforceability** — and an earlier draft of this note overstated it in exactly the
   way #117 anticipated. What is true: the boundary would be drawn on the **host element,
   which is this repo's own markup** in the light DOM, not on a vendored internal. That is a
   different class from the dist copy gate's "vendored files this repo does not author", so
   the *fix* is unambiguously this repo's to make.

   What is **not** true is that this brings the element within reach of
   `check-contrast.mjs` rule 4. #117 says the gate is silent here *"by construction"*, and
   on inspection that is right three times over, not once:

   - `INTERACTIVE` is `/^<[ \t]*(?:input|select|textarea|button|a)(?=[\s/>])/i` — a
     closed list of native tags. `<gmp-place-autocomplete>` is a custom element and matches
     none of them.
   - The host is **constructed in a `<script>`** — `new PlaceAutocompleteElement({})` in
     `FareEstimatePage.astro`'s loader block — and script bodies are skipped. That is the
     gate's own **second named blind spot**, listed in its header beside this one.
   - Rule 4 fires on a `border-(ink|paper)/α` **class** in the template (`BORDER_RE`),
     whereas the fix here would be an `element.style` assignment or a scoped CSS rule. There
     is no class for the gate to read.

   So covering it would mean changing all three — the tag list, the script-body skip, and
   the class-only reading — each of which is a decision with its own cost, and the second of
   which the gate declined deliberately. **#117's "by construction" is more nearly right
   than the earlier draft allowed.** Recorded here so whoever files the build ticket prices
   the gate work honestly instead of inheriting "plausible reach".

Residual risk is the channel roll — quoted once under "What this repo actually loads" above
and not restated here. It bites this section specifically in one way: **the measurement above
is of 3.65.12f and should be re-taken after the roll.**

### C7. Disposition — the outcome #117 named

#117 says plainly: *"Ruling it out of scope is a legitimate outcome of this ticket."* So this
note owes a disposition rather than a shrug. **Recommendation: in scope, as a fix; out of
scope, as gate coverage.** The two halves come apart, and #117's own framing conflates them:

- **The fix is in scope.** The failure is real and large (1.06:1 against 3:1), the remedy is
  a documented one-property override on this repo's own host element, and it reuses the exact
  step #115 already established. The "vendored widget" argument does not survive the finding
  that the boundary is set from the light DOM.
- **Gate coverage is out of scope.** Per C6.3 it costs three separate changes to
  `check-contrast.mjs`, one of which reverses a deliberate decision (skipping script bodies).
  That is a criterion-enforcement decision of the kind #76 and #115 each filed separately
  rather than folded in, and it should be filed separately again.

This is a recommendation, not the decision — #117 is a research ticket, and the build ticket
is where the call gets made. It is written down so the next reader inherits a position to
argue with rather than an open question to re-derive.

---

## Documented vs. merely observable — the summary the issue asked for

| Thing | Status |
|---|---|
| `border` on the `gmp-place-autocomplete` host overrides the field's border | **Documented contract** — reference CSS Properties list + changelog 3.61.9a |
| `border-radius`, `background-color`, `color`, the six font properties | **Documented contract** — same list |
| `color-scheme` as a theming input, default `light dark` | **Documented contract** — reference + custom-styling page + changelog 3.61.9a |
| `::part(input)` and the nine other named parts (ten in total) | **Documented contract** — reference Parts list, each announced in the changelog |
| `--gmp-mat-*` custom properties (incl. `--gmp-mat-color-outline-decorative`) | **Not applicable to autocomplete** — the custom-styling table's only columns are Details Compact and Details |
| The default light-scheme border colour and width Google draws | **Undocumented.** Measured at runtime (C1): there is **no border** — `0px`, on a `#FFFFFF` fill |
| The resulting boundary against `bg-paper` | **1.06:1** — fails SC 1.4.11's 3:1 (C2) |
| The shadow root's openness | **Closed** — `shadowRoot` is `null`; no JS can pierce it (C3) |
| Any WCAG / SC 1.4.11 / contrast-ratio claim for this element | **Does not exist** in Google's docs, changelog or blog |
| DOM/shadow-DOM stability guarantee for the element | **None per-element.** Only the channel policy, which permits backwards-incompatible changes at each quarterly roll |

The practical consequence for #117: **the fix does not require reaching into shadow DOM.**
A `border` declaration on the host element is Google's documented override, so a brand-token
border that clears 3:1 on `bg-paper` can be set from this repo's own CSS with a supported
mechanism — the same category of move as the existing `color-scheme: light`. Whether it is
*needed* is not answerable from the documentation, which gives no default; **C2 answers it
from the browser — it is needed, at 1.06:1 against a required 3:1.**

---

## Open / unanswerable from documentation

~~1. **What Google actually draws.**~~ **Answered by C1** — nothing. `0px` border on a
   `#FFFFFF` fill, giving 1.06:1 against the card.

~~2. **Whether the host `border` declaration reaches the visible boundary, or paints a
   second box around an inner one.**~~ **Answered by C5** — it reaches it, and draws a
   single box. There is no inner border for it to double.

~~3. **Whether `::part(input)` or the host `border` is the right lever.**~~ **Answered by
   C4 for the boundary** — the host `border`. `::part(input)` matches the inner text input
   only, inset and excluding the search icon, so it draws the wrong rectangle for the
   component boundary. **Scoped to the boundary deliberately:** this does not rule the part
   out for other surfaces, and the two compose (the part is the inner `<input>`, the host is
   the outer box). Item 4 below is the likely case where the part is needed anyway.

4. **Focus state.** `focus-ring` is a documented part but its default appearance and
   contrast are unpublished. SC 1.4.11 covers component *states*; #115's precedent was to
   scope state variants out deliberately rather than silently. Flagged, not answered.
5. **A Maps Platform VPAT.** See B2 — none was found from Google's own pages, and that is
   recorded as unresolved rather than as "none exists". Requesting one is the documented
   route if the build ticket needs it.
6. **How long the documented surface lasts.** No deprecation policy for a CSS part or CSS
   property is published, and this repo rides the weekly channel — quoted once under "What
   this repo actually loads" above. Anything built on this surface should expect to be
   re-verified after the 3.66 roll.
7. **Shadow-DOM-in-shadow-DOM.** Google's Basic Autocomplete sample notes "info window
   content is inside the shadow DOM when using `<gmp-map>`" and therefore uses inline styles
   there. This site mounts the autocomplete into its own light-DOM slot, not inside
   `<gmp-map>`, so the caveat should not bite — but it is untested here.
