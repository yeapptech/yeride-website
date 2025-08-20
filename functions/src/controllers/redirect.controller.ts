/* eslint-disable no-useless-escape */
import * as functions from 'firebase-functions';

export const handleStripeRedirectLogic = async (req, res) => {
    const DEEPLINK_BASE_URL = "yeride://"; 
    const path = req.params.path;

    console.log('PATH!!!:> ', req.params)

    let redirectUrl = `${DEEPLINK_BASE_URL}${path}`;

    // @ts-ignore
    const queryParams = new URLSearchParams(req.query).toString();
    if (queryParams) {
        redirectUrl += `?${queryParams}`;
    }

    console.log(`Redirecting Stripe from ${req.url} to deep link: ${redirectUrl}`);
    return res.redirect(303, redirectUrl);
};