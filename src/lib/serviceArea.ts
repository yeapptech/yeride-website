// The service area /fare-estimate prices (wayfinder #62).
//
// It lives here rather than in `./fareEstimate` for one mechanical reason: the
// page has to NAME this area in its markup, and `./fareEstimate` imports
// `./firebase`, which calls `initializeApp` at module scope. Importing it from
// Astro frontmatter would run Firebase initialisation during the static build
// to read a string constant. This module has no dependencies at all.

/**
 * The one area this page prices — asked for on EVERY call, whatever the rider
 * typed. `estimateFares` returns the id it was given and never another
 * (yeride-functions `handlers/estimate-fares.js`: `return {serviceAreaId,
 * estimates}`), so a route in Chicago comes back priced at South Florida rates
 * and rendered as a fare for a ride YeRide does not run.
 *
 * The page therefore states which area it quoted, and the request and the label
 * read THIS constant — a second literal spelling the area into the copy would
 * go stale silently the moment this one changed, and the page would then name
 * the wrong market while pricing another.
 *
 * Choosing the area from the rider's pickup instead is #73, and it is not built
 * here because it cannot be exercised yet: the test is point-in-circle against
 * each area's `latitude`/`longitude`/`radius`, and `getFeeSchedule` publishes
 * only `{id, identifier}` today (yeride-functions#45 adds the circle). The
 * semantics are already settled — yeride-mobile's `ResolveActiveServiceArea`
 * does Haversine, inclusive at the boundary, first match in document-id order.
 */
export const DEFAULT_SERVICE_AREA_ID = "us-fl-south-florida";
