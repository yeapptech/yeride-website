import * as functions from "firebase-functions";

export const handleStripeRedirect = functions.https.onRequest(async (req, res) => {
  let redirectUrl = "<span class=\"math-inline\">{DEEPLINK_BASE_URL}</span>{path}";

  const queryParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(req.query).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value)])
    )
  ).toString();
  if (queryParams) {
    redirectUrl += `?${queryParams}`;
  }

  functions.logger.info(`Redirecting Stripe from ${req.url} to deep link: ${redirectUrl}`);
  return res.redirect(303, redirectUrl);
});