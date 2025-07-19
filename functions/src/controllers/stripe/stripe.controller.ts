import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../conf/env.js"; 
import { Request, Response } from "express";

const STRIPE_API_VERSION = "2025-05-28.basil";

export const createVerificationSession = async (req: Request, res: Response): Promise<void> => {
  const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
    apiVersion: STRIPE_API_VERSION,
  });

  try {
    const { userId, returnUrl } = req.body;

    if (!userId) {
      res.status(400).json({ error: "Falta userId en el body" });
      return;
    }

    if (!returnUrl || typeof returnUrl !== "string") {
      res
        .status(400)
        .json({ error: "Falta returnUrl válido en el body" });
      return;
    }

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { userId },
      options: {
        document: {
          allowed_types: ["driving_license"],
          require_id_number: true,
        },
      },
      return_url: returnUrl,
    });

    res.json({ url: session.url });
    return;
  } catch (error: unknown) {
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : String(error);
    res.status(500).json({ error: errorMessage });
    return;
  }
};