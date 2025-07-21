import Stripe from 'stripe';
import admin from 'firebase-admin';
import { STRIPE_SECRET_KEY } from "../../conf/env.js";

const STRIPE_API_VERSION = '2025-06-30.basil';


export const verifyApiCostsPaymentStatus = async (req, res) => {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    });
    try {
        const { clientSecret } = req.body;

        const authenticatedUserId = req.user?.uid;
        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'Unauthenticated. A valid Firebase user ID token is required.' });
        }

        if (!clientSecret) {
            return res.status(400).json({ error: 'Client secret is required.' });
        }

        const paymentIntentId = clientSecret.split('_secret_')[0];
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId); 

        if (paymentIntent.metadata.firebaseUid !== authenticatedUserId) {
            return res.status(403).json({ error: 'Permission denied. Payment intent does not belong to this user.' });
        }

        let cardDetailsToSave = null;
        let paymentMethodId = paymentIntent.payment_method; 

        if (paymentMethodId) {
            try {
              // @ts-ignore
                const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
                
                if (paymentMethod.type === 'card' && paymentMethod.card) {
                    cardDetailsToSave = {
                        brand: paymentMethod.card.brand,
                        last4: paymentMethod.card.last4,
                        exp_month: paymentMethod.card.exp_month,
                        exp_year: paymentMethod.card.exp_year,
                        country: paymentMethod.card.country,
                        fingerprint: paymentMethod.card.fingerprint,
                        funding: paymentMethod.card.funding,
                    };
                    console.log(`Card details retrieved for PaymentMethod ${paymentMethodId}:`, cardDetailsToSave);

                    const userPaymentMethodsRef = admin.firestore()
                        .collection('users')
                        .doc(authenticatedUserId)
                        .collection('paymentMethods');

                        // @ts-ignore
                    await userPaymentMethodsRef.doc(paymentMethodId).set({
                        paymentMethodId: paymentMethodId,
                        card: cardDetailsToSave,
                        customerId: paymentIntent.customer,
                        isDefault: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                    
                    console.log(`PaymentMethod ${paymentMethodId} saved to user's subcollection.`);

                    await admin.firestore().collection('users').doc(authenticatedUserId).update({
                        lastUsedPaymentMethodId: paymentMethodId,
                    });

                } else {
                    console.warn(`PaymentMethod ${paymentMethodId} is not a card or has no card details.`);
                }
            } catch (pmError) {
                console.error(`Error retrieving PaymentMethod ${paymentMethodId}:`, pmError);
            }
        } else {
            console.warn(`PaymentIntent ${paymentIntent.id} has no associated payment_method.`);
        }

        const paymentRecordRef = admin.firestore().collection('apiPayments').doc(paymentIntent.id);
        await paymentRecordRef.set({
            userId: authenticatedUserId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            cardDetails: cardDetailsToSave, 
            paymentMethodId: paymentMethodId, 
        }, { merge: true });

        res.json({ status: paymentIntent.status });

    } catch (error) {
        console.error("Error verifying API Costs PaymentIntent status:", error);
        if (error.code === 'resource_missing') {
            return res.status(404).json({ error: 'Payment Intent not found.' });
        }
        res.status(500).json({ error: error.message || 'Unable to verify payment status.' });
    }
};