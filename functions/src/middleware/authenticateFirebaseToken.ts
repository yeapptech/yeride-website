import * as admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import * as functionsLogger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

const authenticateFirebaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    functionsLogger.warn("Unauthorized: No token provided or invalid format.");
    return res.status(401).json({ error: "Unauthorized: No token provided or invalid format." });
  }

  const idToken = authorizationHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    functionsLogger.log(`Firebase ID token authenticated successfully for UID: ${decodedToken.uid}`);
    return next();
  } catch (error: any) {
    functionsLogger.error("Error verifying Firebase ID token:", error);
    const errorMessage = (error as Error)?.message || "Invalid token.";
    return res.status(401).json({ error: `Unauthorized: ${errorMessage}` });
  }
};

export default authenticateFirebaseToken;