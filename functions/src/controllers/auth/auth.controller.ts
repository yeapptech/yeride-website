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

  // const { firstName, lastName, email, password, phoneNumber, role } = data;
  const { firstName, lastName, email, phoneNumber, role } = data;

  if (!firstName || !lastName || !email || !phoneNumber || !role) {
    res.status(400).json({
      error: "Missing required registration data...",
    } as ErrorResponse);
    return;
  }

  // let registeredUser: UserRecord | null = null;

  try {
    const existingUsers = await authAdmin.getUsers([{ email: email }]);
 
    if (existingUsers.users.length > 0) {
      res.status(409).json({
        code: "auth/email-already-in-use",
        error: "The email address is already in use by another account.",
      } as ErrorResponse);
      return;
    }

    // console.log("LOG: Attempting to create new user in Auth..."); // <--- NUEVO LOG 3
    // const userRecord = await authAdmin.createUser({
    //   email: email,
    //   password: password,
    //   displayName: fullName,
    //   phoneNumber: phoneNumber,
    // });
    // registeredUser = userRecord;
    // console.info(`LOG: User created with UID: ${userRecord.uid}`); // <--- NUEVO LOG 4

    // const defaultDriverOnboardingProgress = {
    //   acceptedTerms: false,
    //   apiCostsPaid: false,
    //   stripeConnected: false,
    //   licenseVerified: false,
    //   criminalRecords: false,
    //   vinAuditPassed: false,
    //   insuranceVerified: false,
    //   personalInfoCompleted: false,
    //   identityVerified: false,
    //   backgroundCheckCompleted: false,
    //   vehicleCheck: false,
    // };

    const personDataToCreate = {
      // uid: registeredUser.uid,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber,
      // identityVerified: false,
      // licenseVerified: false,
      // age: 0,
      // profileCompleted: false,
      role: role,
      createdAt: new Date().toISOString(),
      registrationCompletedAt: ""
    };

    await dbAdmin.collection("whitelist").add(personDataToCreate);
    // .set(personDataToCreate);
    // .doc(registeredUser.uid)
    // console.debug(
    //   `LOG: Firestore document created for user ${registeredUser.uid}`
    // );

    res.status(200).json({
      success: true,
      message: "User registered successfully!",
      // uid: registeredUser.uid,
    });
    return;
  } catch (error: any) {
    // if (
    //   registeredUser &&
    //   typeof error === "object" && error !== null &&
    //   "code" in error &&
    //   (error as { code?: string }).code !== "auth/email-already-in-use" &&
    //   (error as { code?: string }).code !== "auth/phone-number-already-exists"
    // ) {
    //   try {
    //     await authAdmin.deleteUser(registeredUser.uid);
    //     console.info(
    //       `Cleaned up partially created user: ${registeredUser.uid}`
    //     );
    //   } catch (deleteError: any) {
    //     console.error(
    //       "Failed to clean up partially created user:",
    //       deleteError
    //     );
    //   }
    // }

    const statusCode = 500;
    const errorMessage = "An unexpected error occurred during registration.";
    const errorCode = "internal";

    // if (
    //   typeof error === "object" &&
    //   error !== null &&
    //   "code" in error &&
    //   typeof (error as { code?: string }).code === "string" &&
    //   (error as { code: string }).code.startsWith("auth/")
    // ) {
    //   switch (((error as any) as { code: string; message?: string }).code) {
    //     case "auth/email-already-in-use":
    //     case "auth/phone-number-already-exists":
    //     case "auth/credential-already-in-use":
    //       statusCode = 409;
    //       errorMessage =
    //       (error as { code: string }).code === "auth/email-already-in-use"
    //           ? "The email address is already in use."
    //           : "The provided phone number is already in use by another account.";
    //       errorCode = "already-exists";
    //       break;
    //     case "auth/weak-password":
    //     case "auth/invalid-email":
    //     case "auth/invalid-phone-number":
    //       statusCode = 400;
    //     errorMessage = error instanceof Error?error.message:"";
    //       errorCode = "invalid-argument";
    //       break;
    //     case "auth/id-token-expired":
    //     case "auth/argument-error":
    //     case "auth/invalid-credential":
    //       statusCode = 401;
    //       errorMessage =
    //         "Authentication failed. Please re-verify or try again.";
    //       errorCode = "unauthenticated";
    //       break;
    //     case "auth/user-not-found":
    //       statusCode = 404;
    //       errorMessage = "User not found.";
    //       errorCode = "not-found";
    //       break;
    //     case "auth/operation-not-allowed":
    //       statusCode = 403;
    //       errorMessage =
    //         "The requested operation is not allowed for this user or project configuration.";
    //       errorCode = "operation-not-allowed";
    //       break;
    //     default:
    //       statusCode = 500;
    //       const firebaseErrorMessage =error instanceof Error?error.message:"";
    //       errorMessage = `Firebase Auth Error: ${firebaseErrorMessage}`;
    //       errorCode = "internal";
    //       break;
    //   }
    // } else if (
    //   typeof error === "object" &&
    //   error !== null &&
    //   "message" in error &&
    //   typeof (error as { message?: string }).message === "string" &&
    //   (error as { message: string }).message.includes("A network error") &&
    //   (error as { message: string }).message.includes("auth/")
    // ) {
    //   statusCode = 503;
    //   errorMessage =
    //     "Firebase Auth service is temporarily unavailable. Please try again.";
    //   errorCode = "unavailable";
    // } else {
    //   statusCode = 500;
    //   errorMessage =
    //       (typeof error === "object" && error !== null && "message" in error &&
    //         typeof (error as { message?: string }).message === "string") ?
    //         ((error as any) as { message: string }).message :
    //         "An unexpected error occurred during registration.";
    //   errorCode = "internal";
    // }

    res.status(statusCode).json({
      code: errorCode,
      error: errorMessage,
    } as ErrorResponse);
    return;
  }
};
