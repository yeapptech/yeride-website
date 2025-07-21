/* eslint-disable no-useless-escape */
import * as functions from 'firebase-functions';

export const handleStripeRedirect = functions.https.onRequest(async (req, res) => {
    const DEEPLINK_BASE_URL = "yeappdriver://";
    const successPath = "stripe-connect-return";
    const refreshPath = "stripe-connect-refresh";

    const { account_id, state } = req.query;
    const path = req.path.substring(1);

    let redirectUrl = `<span class="math-inline">\{DEEPLINK\_BASE\_URL\}</span>{path}`;

    // @ts-ignore
    const queryParams = new URLSearchParams(req.query).toString();
    if (queryParams) {
        redirectUrl += `?${queryParams}`;
    }

    functions.logger.info(`Redirecting Stripe from ${req.url} to deep link: ${redirectUrl}`);
    return res.redirect(303, redirectUrl);
});