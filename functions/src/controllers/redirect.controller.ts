/* eslint-disable no-useless-escape */
import * as functions from 'firebase-functions';

export const handleStripeRedirect = functions.https.onRequest(async (req, res) => {
    const DEEPLINK_BASE_URL = "yeride://";
    const { account_id, state } = req.query;
    const path = req.path.substring(1);

    let redirectUrl = `${DEEPLINK_BASE_URL}${path}`;

    // @ts-ignore
    const queryParams = new URLSearchParams(req.query as any).toString();
    if (queryParams) {
        redirectUrl += `?${queryParams}`;
    }

    functions.logger.info(`Redirecting Stripe from ${req.url} to deep link: ${redirectUrl}`);
    return res.redirect(303, redirectUrl);
});