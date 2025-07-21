import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from "../../conf/env.js";

const STRIPE_API_VERSION = '2025-06-30.basil';


export const createVerificationSession = async (req, res) => {
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
  });
  try {
    const { userId, returnUrl } = req.body; 

    if (!userId) {
      return res.status(400).json({ error: 'Falta userId en el body' });
    }

    if (!returnUrl || typeof returnUrl !== 'string') {
        return res.status(400).json({ error: 'Falta returnUrl válido en el body' });
    }

    console.log('Creando sesión de verificación con return_url:', returnUrl);

    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: { userId },
      options: {
        document: {
          allowed_types: ['driving_license'],
          require_id_number: true,
        },
      },
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error al crear sesión de verificación:', error);
    res.status(500).json({ error: error.message });
  }
};