// Shared-block copy — VERBATIM from docs/copy-map.md §2.1 (availability) and
// §2.2 (pre-registration form), wayfinder #34.
//
// TWO DEVIATIONS FROM §2.2, both forced by what the endpoint actually is, both
// flagged on #37 and amended into the copy map:
//
//  1. NO PASSWORD FIELDS. §2.2 specifies "Password" and "Confirm password" with
//     their own validation lines. `POST ${PUBLIC_API_URL}v1/auth/register` is
//     yeride-admin-api's `auth` controller: it destructures firstName,
//     lastName, email, phoneNumber and role, and nothing else. `password` is
//     commented out of its own `RegisterUserData` interface. A password typed
//     here would be sent over the wire and dropped on the floor — while telling
//     the person they now have a credential they do not have. It is not
//     collected. (The fields were already commented out in the shipped form;
//     this build makes that deliberate rather than incidental.)
//
//  2. A duplicate PHONE NUMBER gets its own line. The endpoint dedupes on both
//     email and phone, returning 409 `pre-registration/phone-number-already-in-use`
//     for the second — §2.2 had only the email class, so a repeat phone would
//     have been told the wrong thing about their email.
//
// The same reading corrects §2.2's flag note: this form does NOT create a
// production account. It adds a row to the `whitelist` collection with
// `registrationCompletedAt: null`. The pre-registration framing the copy map
// kept as a loose label is, in fact, exactly what happens.
import type { Lang } from "./feesCopy";

export const formCopy = {
  en: {
    firstNameLabel: "First name",
    firstNamePlaceholder: "Your first name",
    lastNameLabel: "Last name",
    lastNamePlaceholder: "Your last name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone",
    phonePlaceholder: "+1 305 555 0100",
    submit: "Pre-register",
    submitting: "Sending…",
    required: "This one's required.",
    badEmail: "That doesn't look like an email address.",
    badPhone: "Include the country code, like +1 305 555 0100.",
    success: "You're pre-registered.",
    emailTaken: "That email is already registered.",
    // Authored for this build — see deviation 2 above.
    phoneTaken: "That phone number is already registered.",
    rejected: "Check the details and try again.",
    network: "We couldn't reach the server. Try again in a moment.",
    server: "Something went wrong. Try again.",
  },
  es: {
    firstNameLabel: "Nombre",
    firstNamePlaceholder: "Tu nombre",
    lastNameLabel: "Apellido",
    lastNamePlaceholder: "Tu apellido",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tucorreo@ejemplo.com",
    phoneLabel: "Teléfono",
    phonePlaceholder: "+1 305 555 0100",
    submit: "Pre-regístrate",
    submitting: "Enviando…",
    required: "Este campo es obligatorio.",
    badEmail: "Ese correo no parece válido.",
    badPhone: "Incluye el código de país, como +1 305 555 0100.",
    success: "Ya estás pre-registrado.",
    emailTaken: "Ese correo ya está registrado.",
    phoneTaken: "Ese teléfono ya está registrado.",
    rejected: "Revisa los datos e intenta de nuevo.",
    network: "No pudimos conectar. Intenta de nuevo en un momento.",
    server: "Algo salió mal. Intenta de nuevo.",
  },
} satisfies Record<Lang, unknown>;

export const availabilityCopy = {
  en: {
    lead: "YeRide is live on Android.",
    playAlt: "Get it on Google Play",
    ios: "iOS is in beta — join the TestFlight.",
  },
  es: {
    lead: "YeRide ya está en Android.",
    playAlt: "Disponible en Google Play",
    ios: "iOS está en beta — únete al TestFlight.",
  },
} satisfies Record<Lang, unknown>;
