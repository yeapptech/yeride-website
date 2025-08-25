import { Request, Response } from "express";
import {
  auth as authAdmin,
  db as dbAdmin,
} from "../../utils/firebaseAdminConfig.js";
// import {UserRecord} from "firebase-admin/auth";

interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  // password?: string;
  phoneNumber: string;
  // phoneVerificationId?: string;
  // phoneVerificationCode?: string;
  role: string;
}

interface ErrorResponse {
  code: string;
  error: string;
}

export const login = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      code: "method-not-allowed",
      error: "Method Not Allowed. Only POST requests are accepted.",
    } as ErrorResponse);
  }

  const { idToken } = req.body as { idToken: string };

  if (!idToken) {
    return res.status(400).json({
      code: "missing-token",
      error: "Missing Firebase ID Token in request body.",
    } as ErrorResponse);
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const userDocRef = dbAdmin
      .collection("users")
      .where("email", "==", email)
      .limit(1);
    const userSnapshot = await userDocRef.get();

    let userDataFromFirestore: any = null;
    if (!userSnapshot.empty) {
      userDataFromFirestore = userSnapshot.docs[0].data();
    } else {
      console.warn(
        `User with email ${email} (UID: ${uid}) not found in 'users' collection.`
      );
      return res.status(404).json({
        code: "user-data-not-found",
        error: "User profile data not found in users.",
      } as ErrorResponse);
    }

    return res.status(200).json({
      success: true,
      message: "User logged in successfully!",
      uid: uid,
      email: email,
      role: userDataFromFirestore?.role || undefined,
      firstName: userDataFromFirestore?.firstName || undefined,
      lastName: userDataFromFirestore?.lastName || undefined,
    });
  } catch (error: any) {
    console.error(
      "Error during token verification or Firestore lookup:",
      error
    );

    let statusCode = 500;
    let errorMessage = "An unexpected error occurred during login.";
    let errorCode = "internal";

    if (error.code) {
      switch (error.code) {
        case "auth/invalid-id-token":
          statusCode = 401; 
          errorMessage = "The provided ID token is not a valid Firebase ID token.";
          errorCode = "invalid-token";
          break;
        case "auth/user-not-found":
          statusCode = 404;
          errorMessage = "User not found in Firebase Authentication.";
          errorCode = "user-not-found-auth";
          break;
        default:
          errorMessage = `Firebase Auth Error: ${error.message}`;
          errorCode = error.code;
          break;
      }
    }

    return res.status(statusCode).json({
      code: errorCode,
      error: errorMessage,
      details: error.message,
    } as ErrorResponse);
  }
};

export const auth = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method Not Allowed. Only POST requests are accepted.",
    } as ErrorResponse);
    return;
  }

  const { data } = req.body as { data: RegisterUserData };

  if (!data) {
    res.status(400).json({
      error: "Missing data payload in request body.",
    } as ErrorResponse);
    return;
  }

  const { firstName, lastName, email, phoneNumber, role } = data;

  if (!firstName || !lastName || !email || !phoneNumber || !role) {
    res.status(400).json({
      error: "Missing required registration data...",
    } as ErrorResponse);
    return;
  }

  try {
    const emailQuerySnapshot = await dbAdmin.collection("whitelist")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!emailQuerySnapshot.empty) {
      res.status(409).json({
        code: "pre-registration/email-already-in-use",
        error: "The email address is already in use.",
      } as ErrorResponse);
      return;
    }

    const phoneQuerySnapshot = await dbAdmin.collection("whitelist")
      .where("phoneNumber", "==", phoneNumber)
      .limit(1)
      .get();

    if (!phoneQuerySnapshot.empty) {
      res.status(409).json({
        code: "pre-registration/phone-number-already-in-use",
        error: "The phone number is already in use.",
      } as ErrorResponse);
      return;
    }

    const personDataToCreate = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber,
      role: role,
      createdAt: new Date().toISOString(),
      registrationCompletedAt: null,
    };
    
    await dbAdmin.collection("whitelist").add(personDataToCreate);

    res.status(200).json({
      success: true,
      message: "User registered successfully!",
    });
    return;
  } catch (error: any) {
    console.error("Error during pre-registration:", error);
    res.status(500).json({
      code: "internal-error",
      error: "An unexpected error occurred during pre-registration.",
    } as ErrorResponse);
    return;
  }
};
