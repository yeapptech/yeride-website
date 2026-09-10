// /privacy-policy, /terms and their ES twins — wayfinder #44.
//
// Copy-map §3.8 and §3.9 fix only the H1s and the governing-language note and
// say the bodies are "a legal-review task, not a copy-map entry". These are
// those bodies. Ten decisions settled them, all recorded on #44:
//
//   1. ONE POLICY FOR THE WHOLE SERVICE — site, app and rides. The mobile app
//      links `yeride.com/privacy` from its Profile screen and submits it as the
//      store-listing privacy URL (yeride-mobile#123, which blocks store
//      submission #126 precisely because the URL 404s). A site-only policy
//      would be false the moment the app pointed at it.
//   2. IT DESCRIBES WHAT IS TRUE TODAY. The app on Play today is the LEGACY
//      app (`yeapptech/yeride`), not the `yeride-mobile` rewrite. Everything
//      below was read off the shipping source, not off the rewrite's plans, and
//      is phrased so the rewrite narrows it rather than contradicting it — the
//      rewrite strips background location and adds in-app deletion, and both
//      are already true-but-broader here.
//   3. RETENTION IS STATED AS IT IS. There is no TTL, no scheduled cleanup and
//      no expiry anywhere in the stack (checked across yeride-functions). A
//      named window would be a promise nothing enforces, so §6 says what
//      actually happens: nothing is deleted until asked.
//   4. RIGHTS ARE GRANTED VOLUNTARILY. No US statute compels them at this size
//      (Florida's Digital Bill of Rights starts at $1B revenue; CCPA at $25M),
//      and they are offered to everyone anyway, with no residency test.
//   5. THE TERMS STATE THE INSURANCE POSITION AS IT IS TODAY — the driver's
//      own duty under Fla. Stat. § 627.748(7), that nothing of YeRide's own is
//      currently in force, and § 627.748(8)(a)2's warning that a personal
//      policy might provide no coverage — see the copy-gate note below.
//   6. FLORIDA LAW AND FLORIDA COURTS. No arbitration clause and no
//      class-action waiver: a defective one is routinely struck, and it is the
//      clause that most needs a lawyer rather than an agent.
//
// REGISTER: formal, a deliberate exception to §0.2's site-wide informal *tú*.
// The ES documents address the reader as *usted* throughout.
//
// ── The copy gate and the word "insurance" ──────────────────────────────
//
// §5 gates `insurance` / `coverage` / `seguro` / `póliza` / `cobertura` on #48,
// because YeRide carries none and the home page once claimed it did. The gate
// matches patterns, not meaning, so it cannot tell a CLAIM from a DENIAL — and
// a terms page whose job is to say there is no insurance has to say it. Those
// lines carry an explicit `copy-gate-allow` naming #48, so every one of them
// prints on every build. When #48 lands the statements become FALSE and must be
// rewritten, not merely un-pragma'd; that is why #48 is the right ticket to
// hang them on.
import type { Lang } from "./feesCopy";

/** A paragraph, or a bullet list. */
export type Block = string | string[];

export interface Section {
  heading: string;
  blocks: Block[];
}

export interface LegalDoc {
  h1: string;
  updated: string;
  lead: string;
  sections: Section[];
  /** Copy-map §3.8/§3.9 — verbatim, on both language versions. */
  governing: string;
}

const GOVERNING_EN = "The English version governs in the event of any conflict.";
const GOVERNING_ES = "En caso de conflicto, prevalece la versión en inglés.";

export const privacyCopy: Record<Lang, LegalDoc> = {
  en: {
    h1: "Privacy Policy",
    updated: "Last updated: 2 August 2026",
    lead:
      "This policy covers www.yeride.com and the YeRide app for Android and iOS. " +
      "YeRide is operated by YeAPP TECH LLC, a Florida limited liability company. " +
      "It says what we collect, why we collect it, who else sees it, and how to " +
      "make us delete it.",
    sections: [
      {
        heading: "1. What this website collects",
        blocks: [
          "When you pre-register on this site we ask for your first name, last " +
            "name, email address, phone number, and whether you are signing up as " +
            "a driver or a rider. That is the whole form. It does not create an " +
            "account — it puts you on the list we contact when YeRide opens to you.",
          "When you estimate a fare, the addresses you type go from your browser " +
            "to Google Maps, so it can suggest places and measure the route. They " +
            "are not sent to YeRide. What reaches us is the distance, the duration " +
            "and the service area — never where you are going.",
          "YeRide sets no cookies on this site, runs no analytics and shows no " +
            "advertising. We add no tracking of our own to any page.",
          "One page does load code from other companies in order to work: the fare " +
            "estimate uses Google Maps and Firebase. Those companies can store data " +
            "in your browser, and what they do with it is governed by their own " +
            "privacy policies.",
          // Says only what a reader can check, and deliberately says no more.
          //
          // An earlier draft added "and mail you send us arrives with us
          // directly", which asserts there is no intermediary —
          // support@yeride.com resolves through a mail provider that handles
          // the message, so that was a claim this policy cannot support. Cut.
          //
          // DECIDED 2026-08-06: §4 does not name the mail host. So this line
          // must stay silent on the subject rather than swing to either side —
          // it neither names a provider nor denies one. Do not "improve" it by
          // adding reassurance about where mail goes; that is the claim that
          // was removed, and the silence is deliberate, not an omission.
          "Our contact page carries no form; it gives you an email address instead.",
          "The site itself is served by GitHub Pages, which records the usual " +
            "web-server information — such as your IP address and browser — in " +
            "order to deliver the page to you. Those logs are GitHub's; we do not " +
            "receive them.",
        ],
      },
      {
        heading: "2. What the app collects",
        blocks: [
          "The YeRide app collects more than this website does, because it has to " +
            "run an actual ride:",
          [
            "Your account — your name, email address, phone number, password and, " +
              "if you add one, a profile photo. We also record whether your email " +
              "address has been verified.",
            "Your location — the app collects your device's precise location from " +
              "the moment you sign in until you sign out. This applies whether you " +
              "are a rider or a driver and whether or not a trip is running, and the " +
              "app asks for permission to do it in the background as well as while " +
              "you are looking at the screen. That is how riders are matched to " +
              "nearby drivers, how distance and duration are measured, and how a " +
              "route is drawn and followed to its end. The app also keeps a log of " +
              "these locations on your own device for up to 14 days. You can switch " +
              "location off at any time in your phone's settings; the app cannot " +
              "book or drive a ride without it.",
            "Motion — on iOS the app may read motion activity, meaning whether the " +
              "device is walking, cycling or in a vehicle, to tell moving from stopped.",
            "Your trips — pickup and drop-off, the route taken, the times, the fare " +
              "and the charges on it, and how the trip ended.",
            "Messages — riders and drivers matched on a trip can message each other " +
              "in the app, and we hold those messages.",
            "If you drive: your vehicle's make, model, year, colour, licence plate " +
              "and VIN, photographs of it, and the vehicle's " +
              // copy-gate-allow: factual description of a field the app collects, not a claim that YeRide carries any — rewrite when #48 lands
              "insurance policy number.",
            "Payment — card details are entered into Stripe, not into YeRide, and " +
              "we never see or store a card number. What we do store is what is " +
              "needed to show you which card you saved and to charge it for a ride: " +
              "a Stripe reference, the card's brand, its last four digits and " +
              "whether it is debit or credit. Drivers are paid through Stripe " +
              "Connect, and the identity and tax information Stripe needs in order " +
              "to pay a driver goes to Stripe directly — it does not reach us. When " +
              "a rider pays cash, the fare passes from rider to driver in person; " +
              "YeRide then charges the driver's own Stripe account for its fees on " +
              "that ride, and records that charge against the trip.",
            "Your device — if the app crashes, Firebase Crashlytics sends us a crash " +
              "report identifying the device model, the operating system version and " +
              "the app installation. If you allow notifications, we store a push " +
              "token for your device so we can send them.",
          ],
        ],
      },
      {
        heading: "3. Why we use it",
        blocks: [
          "We use what we collect to run rides and nothing else. Specifically: to " +
            "match riders with drivers; to calculate fares and charges; to take " +
            "payment and pay drivers; to contact you about your account or a ride; " +
            "to act on reports of abusive behaviour; to find and fix crashes; and to " +
            "meet the tax, accounting and legal obligations that come with running " +
            "a business.",
          "We do not sell your personal data. We do not give it to data brokers. We " +
            "run no advertising and build no advertising profiles.",
        ],
      },
      {
        heading: "4. Who else sees it",
        blocks: [
          "We use other companies to run parts of the service. They receive only " +
            "what their part requires:",
          [
            "Google — Firebase holds our accounts, database, files and crash " +
              "reports; Google Maps provides place suggestions, routes and navigation.",
            "Stripe — card payments and driver payouts.",
            "Expo — push notifications are sent through Expo, which receives your " +
              "device's notification token and the text of the notification. That " +
              "text can name a person, such as the driver assigned to your trip. " +
              "Expo hands it to Apple or Google, who deliver it to your device.",
            "The National Highway Traffic Safety Administration — if you register a " +
              "vehicle to drive, its VIN is sent to this US Department of " +
              "Transportation service to look up the vehicle's details.",
          ],
          "We will also hand over data where the law requires it, such as a valid " +
            "court order or a lawful request from law enforcement.",
          "If YeRide is ever sold or merged into another business, these records " +
            "would go with it. You would be told before that happened.",
        ],
      },
      {
        heading: "5. Where it is held",
        blocks: [
          "YeRide's data is held in the United States — in Google Cloud, and at " +
            "Stripe for anything to do with payments.",
        ],
      },
      {
        heading: "6. How long we keep it",
        blocks: [
          "We keep what we collect until you ask us to delete it, or until we no " +
            "longer need it for ride records, payment history and the tax and " +
            "accounting obligations that come with them.",
          "Almost nothing is deleted automatically. No account, pre-registration " +
            "entry, trip, message or stored location expires on a timer. There are " +
            "two exceptions, and neither is about you: short-lived technical records " +
            "used to rate-limit our own service are purged daily, and the location " +
            "log the app keeps on your device rolls off after 14 days. If you want " +
            "your data gone, ask us — that is the whole mechanism, and it is " +
            "described next.",
        ],
      },
      {
        heading: "7. Your choices",
        blocks: [
          "Write to support@yeride.com and you can ask us to:",
          [
            "tell you what we hold about you,",
            "correct anything that is wrong, or",
            "delete your account and your personal data.",
          ],
          "Deletion today is by email, and we will confirm when it is done. When we " +
            "delete an account we remove your login, your profile, your stored " +
            "location and your rider payment record at Stripe, and we strip your " +
            "name and contact details from your trip records. Completed trips " +
            "themselves stay: both sides of a ride hold a financial record of it, " +
            "and the tax and accounting obligations on it outlast the account. A " +
            "driver's Stripe payout account stays for the same reason.",
          "One thing to know, because we would rather say it than let you assume " +
            "otherwise: the event log attached to a trip — the running account of " +
            "what happened during it — can still contain a name that was written " +
            "into its text at the time. Ask us and we will remove those by hand too.",
          "On your phone, location and notifications are controlled in the system " +
            "settings and you can withdraw either at any time. The app needs your " +
            "location to book or to drive a ride, so switching it off will stop those " +
            "from working.",
        ],
      },
      {
        heading: "8. Children",
        blocks: [
          "YeRide is for adults. You must be 18 or older to use it, and we do not " +
            "knowingly collect personal data from children. If you believe a child " +
            "has given us personal data, write to support@yeride.com and we will " +
            "delete it.",
        ],
      },
      {
        heading: "9. Security",
        blocks: [
          "Card numbers never reach us — Stripe holds them. Traffic between your " +
            "device and our systems is encrypted in transit.",
          "Beyond that we will not make promises we cannot keep. No online service " +
            "is perfectly secure, and ours is not either.",
        ],
      },
      {
        heading: "10. Changes to this policy",
        blocks: [
          "When this policy changes we publish the new version here and change the " +
            "date at the top. If a change materially affects what we do with your " +
            "data, we will tell you in the app or by email rather than leaving you to " +
            "notice it.",
        ],
      },
      {
        heading: "11. Contact",
        blocks: [
          "YeAPP TECH LLC, Florida, United States. Write to support@yeride.com " +
            "about anything in this policy.",
        ],
      },
    ],
    governing: GOVERNING_EN,
  },

  es: {
    h1: "Política de privacidad",
    updated: "Última actualización: 2 de agosto de 2026",
    lead:
      "Esta política cubre www.yeride.com y la aplicación YeRide para Android y " +
      "iOS. YeRide es operada por YeAPP TECH LLC, una sociedad de responsabilidad " +
      "limitada de la Florida. Aquí se explica qué recopilamos, por qué, quién " +
      "más lo ve y cómo pedirnos que lo eliminemos.",
    sections: [
      {
        heading: "1. Qué recopila este sitio",
        blocks: [
          "Cuando usted se prerregistra en este sitio le pedimos su nombre, su " +
            "apellido, su correo electrónico, su número de teléfono y si se registra " +
            "como conductor o como pasajero. Ese es todo el formulario. No crea una " +
            "cuenta: lo incorpora a la lista de personas a las que contactamos " +
            "cuando YeRide se abra para usted.",
          "Cuando usted estima una tarifa, las direcciones que escribe van desde su " +
            "navegador a Google Maps, para que sugiera lugares y mida la ruta. No se " +
            "envían a YeRide. Lo que llega hasta nosotros es la distancia, la " +
            "duración y el área de servicio, nunca a dónde va usted.",
          "YeRide no coloca cookies en este sitio, no ejecuta analítica y no " +
            "muestra publicidad. No añadimos rastreo propio a ninguna página.",
          "Una página sí carga código de otras empresas para poder funcionar: el " +
            "estimador de tarifa usa Google Maps y Firebase. Esas empresas pueden " +
            "guardar datos en su navegador, y lo que hagan con ellos se rige por sus " +
            "propias políticas de privacidad.",
          "Nuestra página de contacto no tiene formulario; en su lugar le damos " +
            "una dirección de correo.",
          "El sitio en sí lo sirve GitHub Pages, que registra la información " +
            "habitual de un servidor web —como su dirección IP y su navegador— para " +
            "poder entregarle la página. Esos registros son de GitHub; nosotros no " +
            "los recibimos.",
        ],
      },
      {
        heading: "2. Qué recopila la aplicación",
        blocks: [
          "La aplicación YeRide recopila más que este sitio, porque tiene que " +
            "realizar un viaje real:",
          [
            "Su cuenta: su nombre, su correo electrónico, su número de teléfono, su " +
              "contraseña y, si usted la agrega, una foto de perfil. También " +
              "registramos si su correo electrónico ha sido verificado.",
            "Su ubicación: la aplicación recopila la ubicación precisa de su " +
              "dispositivo desde que usted inicia sesión hasta que la cierra. Esto " +
              "ocurre tanto si usted es pasajero como conductor, haya o no un viaje " +
              "en curso, y la aplicación pide permiso para hacerlo también en " +
              "segundo plano, no solo mientras usted mira la pantalla. Así es como " +
              "se conecta a los pasajeros con conductores cercanos, se mide la " +
              "distancia y la duración, y se traza y se sigue una ruta hasta el " +
              "final. La aplicación además guarda un registro de esas ubicaciones en " +
              "su propio dispositivo durante un máximo de 14 días. Usted puede " +
              "desactivar la ubicación cuando quiera desde los ajustes de su " +
              "teléfono; la aplicación no puede pedir ni conducir un viaje sin ella.",
            "Movimiento: en iOS la aplicación puede leer la actividad de movimiento " +
              "—si el dispositivo va caminando, en bicicleta o en un vehículo— para " +
              "distinguir el movimiento de la detención.",
            "Sus viajes: el punto de partida y el de llegada, la ruta recorrida, los " +
              "horarios, la tarifa y los cargos que la componen, y cómo terminó el " +
              "viaje.",
            "Mensajes: los pasajeros y los conductores conectados en un viaje pueden " +
              "escribirse dentro de la aplicación, y nosotros conservamos esos " +
              "mensajes.",
            "Si usted conduce: la marca, el modelo, el año, el color, la placa y el " +
              "VIN de su vehículo, fotografías del mismo y el " +
              // copy-gate-allow: descripción factual de un campo que la app recopila, no una afirmación de que YeRide tenga alguno — reescribir cuando entre #48
              "número de póliza de seguro del vehículo.",
            "Pago: los datos de la tarjeta se ingresan en Stripe, no en YeRide, y " +
              "nunca vemos ni guardamos un número de tarjeta. Lo que sí guardamos es " +
              "lo necesario para mostrarle cuál tarjeta guardó y para cobrarla por " +
              "un viaje: una referencia de Stripe, la marca de la tarjeta, sus " +
              "últimos cuatro dígitos y si es de débito o de crédito. A los " +
              "conductores se les paga mediante Stripe Connect, y la información de " +
              "identidad y tributaria que Stripe necesita para pagarle a un " +
              "conductor va directamente a Stripe: no llega hasta nosotros. Cuando " +
              "un pasajero paga en efectivo, la tarifa va del pasajero al conductor " +
              "en persona; YeRide luego le cobra a la propia cuenta de Stripe del " +
              "conductor sus cargos por ese viaje, y registra ese cobro en el viaje.",
            "Su dispositivo: si la aplicación falla, Firebase Crashlytics nos envía " +
              "un informe de error que identifica el modelo del dispositivo, la " +
              "versión del sistema operativo y la instalación de la aplicación. Si " +
              "usted permite las notificaciones, guardamos un token de envío de su " +
              "dispositivo para poder mandárselas.",
          ],
        ],
      },
      {
        heading: "3. Para qué lo usamos",
        blocks: [
          "Usamos lo que recopilamos para realizar viajes y para nada más. En " +
            "concreto: para conectar pasajeros con conductores; para calcular " +
            "tarifas y cargos; para cobrar y para pagarles a los conductores; para " +
            "comunicarnos con usted sobre su cuenta o un viaje; para actuar ante " +
            "reportes de conducta abusiva; para encontrar y corregir fallas; y para " +
            "cumplir las obligaciones tributarias, contables y legales que conlleva " +
            "operar un negocio.",
          "No vendemos sus datos personales. No los entregamos a intermediarios de " +
            "datos. No hacemos publicidad ni construimos perfiles publicitarios.",
        ],
      },
      {
        heading: "4. Quién más lo ve",
        blocks: [
          "Usamos otras empresas para operar partes del servicio. Cada una recibe " +
            "únicamente lo que su parte requiere:",
          [
            "Google: Firebase aloja nuestras cuentas, la base de datos, los archivos " +
              "y los informes de error; Google Maps aporta las sugerencias de " +
              "lugares, las rutas y la navegación.",
            "Stripe: los pagos con tarjeta y los pagos a los conductores.",
            "Expo: las notificaciones se envían a través de Expo, que recibe el " +
              "token de notificación de su dispositivo y el texto de la " +
              "notificación. Ese texto puede nombrar a una persona, como el " +
              "conductor asignado a su viaje. Expo se lo entrega a Apple o a " +
              "Google, que lo hacen llegar a su dispositivo.",
            "La Administración Nacional de Seguridad del Tráfico en las Carreteras " +
              "(NHTSA): si usted registra un vehículo para conducir, su VIN se envía " +
              "a este servicio del Departamento de Transporte de los Estados Unidos " +
              "para consultar los datos del vehículo.",
          ],
          "También entregaremos datos cuando la ley lo exija, por ejemplo ante una " +
            "orden judicial válida o un requerimiento legítimo de las autoridades.",
          "Si algún día YeRide se vende o se fusiona con otro negocio, estos " +
            "registros irían con él. Se le informaría antes de que eso ocurriera.",
        ],
      },
      {
        heading: "5. Dónde se guarda",
        blocks: [
          "Los datos de YeRide se guardan en los Estados Unidos: en Google Cloud y, " +
            "para todo lo relacionado con pagos, en Stripe.",
        ],
      },
      {
        heading: "6. Cuánto tiempo lo conservamos",
        blocks: [
          "Conservamos lo que recopilamos hasta que usted nos pida eliminarlo, o " +
            "hasta que ya no lo necesitemos para los registros de viajes, el " +
            "historial de pagos y las obligaciones tributarias y contables que los " +
            "acompañan.",
          "Casi nada se elimina automáticamente. Ninguna cuenta, prerregistro, " +
            "viaje, mensaje ni ubicación guardada caduca por sí sola. Hay dos " +
            "excepciones, y ninguna trata sobre usted: unos registros técnicos de " +
            "corta vida que usamos para limitar el ritmo de peticiones a nuestro " +
            "servicio, que se purgan a diario, y el registro de ubicaciones que la " +
            "aplicación guarda en su dispositivo, que se descarta a los 14 días. Si " +
            "usted quiere que sus datos desaparezcan, pídanoslo: ese es todo el " +
            "mecanismo, y se describe a continuación.",
        ],
      },
      {
        heading: "7. Sus opciones",
        blocks: [
          "Escriba a support@yeride.com y puede pedirnos que:",
          [
            "le digamos qué tenemos sobre usted,",
            "corrijamos lo que esté equivocado, o",
            "eliminemos su cuenta y sus datos personales.",
          ],
          "Hoy la eliminación se solicita por correo electrónico, y le confirmaremos " +
            "cuando esté hecha. Al eliminar una cuenta borramos su acceso, su " +
            "perfil, su ubicación guardada y su registro de pago como pasajero en " +
            "Stripe, y retiramos su nombre y sus datos de contacto de sus registros " +
            "de viaje. Los viajes completados en sí permanecen: ambas partes de un " +
            "viaje tienen un registro financiero de él, y las obligaciones " +
            "tributarias y contables que recaen sobre ese registro duran más que la " +
            "cuenta. La cuenta de pagos en Stripe de un conductor permanece por la " +
            "misma razón.",
          "Conviene que sepa una cosa, porque preferimos decirla a dejar que usted " +
            "suponga lo contrario: la bitácora de eventos de un viaje —el relato de " +
            "lo que fue ocurriendo durante él— puede seguir conteniendo un nombre " +
            "que quedó escrito en su texto en aquel momento. Pídanoslo y también los " +
            "retiraremos a mano.",
          "En su teléfono, la ubicación y las notificaciones se controlan desde los " +
            "ajustes del sistema y usted puede retirar cualquiera de las dos en " +
            "cualquier momento. La aplicación necesita su ubicación para pedir o " +
            "para conducir un viaje, así que desactivarla impedirá que eso funcione.",
        ],
      },
      {
        heading: "8. Menores",
        blocks: [
          "YeRide es para personas adultas. Usted debe tener 18 años o más para " +
            "usarla, y no recopilamos a sabiendas datos personales de menores. Si " +
            "usted cree que un menor nos ha dado datos personales, escriba a " +
            "support@yeride.com y los eliminaremos.",
        ],
      },
      {
        heading: "9. Seguridad",
        blocks: [
          "Los números de tarjeta nunca llegan hasta nosotros: los conserva Stripe. " +
            "El tráfico entre su dispositivo y nuestros sistemas viaja cifrado.",
          "Más allá de eso no haremos promesas que no podamos cumplir. Ningún " +
            "servicio en línea es perfectamente inviolable, y el nuestro tampoco.",
        ],
      },
      {
        heading: "10. Cambios a esta política",
        blocks: [
          "Cuando esta política cambie publicaremos aquí la nueva versión y " +
            "cambiaremos la fecha que aparece arriba. Si un cambio afecta de forma " +
            "importante lo que hacemos con sus datos, se lo diremos en la aplicación " +
            "o por correo electrónico, en lugar de dejar que usted lo note.",
        ],
      },
      {
        heading: "11. Contacto",
        blocks: [
          "YeAPP TECH LLC, Florida, Estados Unidos. Escriba a support@yeride.com " +
            "por cualquier asunto de esta política.",
        ],
      },
    ],
    governing: GOVERNING_ES,
  },
};

export const termsCopy: Record<Lang, LegalDoc> = {
  en: {
    h1: "Terms of Service",
    // Moves whenever a term changes in substance. §4 "Paying" lost its cash half
    // on this date (wayfinder #111); the privacy policy is untouched and keeps
    // its own date.
    updated: "Last updated: 10 August 2026",
    lead:
      "These terms are an agreement between you and YeAPP TECH LLC, a Florida " +
      "limited liability company that operates YeRide. They cover www.yeride.com " +
      "and the YeRide app. By creating an account, taking a ride or driving one, " +
      "you accept them.",
    sections: [
      {
        heading: "1. What YeRide is",
        blocks: [
          "YeRide is a technology platform. It connects people who want a ride with " +
            "independent drivers who provide one. YeRide does not provide " +
            "transportation, does not own the vehicles and does not employ the " +
            "drivers.",
          "Drivers use YeRide as independent contractors. Nothing in these terms " +
            "makes a driver an employee, agent or partner of YeRide.",
        ],
      },
      {
        heading: "2. Who can use it",
        blocks: [
          "You must be at least 18 years old and able to enter into a contract. You " +
            "agree to give accurate information, to keep it current and to keep your " +
            "password to yourself. One account per person. You are responsible for " +
            "what happens under your account.",
        ],
      },
      {
        heading: "3. Rides",
        blocks: [
          "A rider requests a ride and a nearby driver accepts it. Neither side is " +
            "obliged to: a driver may decline, and a rider may cancel. Cancelling " +
            "after a driver is on the way may cost a cancellation fee, which is " +
            "published with every other charge on our fee schedule.",
          "Fares are metered. They are calculated from the published base, distance " +
            "and time rates for the service area, and they are not agreed in advance. " +
            "The estimate on this website is an estimate — the meter decides.",
        ],
      },
      {
        heading: "4. Paying",
        blocks: [
          // A term of the agreement, not marketing: this used to say "You can pay
          // by card or in cash." and the app cannot produce a cash trip
          // (obligation #5, yeapptech/yeride-mobile#277). Barred by
          // docs/positioning.md; struck by wayfinder #111. Card is the only method
          // the product implements, so the section states that rather than going
          // silent on how you pay. Restore the cash half only with #277.
          "You pay by card.",
          "Card payments are processed by Stripe, and paying by card means accepting " +
            "Stripe's terms as well as these.",
          "Every rate YeRide meters and every charge it applies is published on the " +
            "fee schedule at www.yeride.com/fees. A change to those takes effect when " +
            "it is published there.",
        ],
      },
      {
        heading: "5. If you drive",
        blocks: [
          "To drive on YeRide you must hold a valid driver's licence, be legally " +
            "entitled to drive for hire where you operate, and register a vehicle you " +
            "are entitled to drive. You are responsible for your vehicle, for your " +
            "own licences and permits, and for your own taxes.",
          "Payouts are made through Stripe Connect and are subject to Stripe's terms.",
        ],
      },
      {
        heading: "6. How you must behave",
        blocks: [
          "YeRide has zero tolerance for objectionable content or abusive behaviour. " +
            "You agree not to post, send or share content that is harassing, hateful, " +
            "sexually explicit, threatening, violent or fraudulent, and not to behave " +
            "abusively toward another rider or driver.",
          "The community guidelines shown in the app when you register are part of " +
            "these terms. Any message in an in-trip chat can be reported, and you can " +
            "block the person you are matched with from within the chat. Accounts " +
            "found to have posted objectionable content or behaved abusively are " +
            "removed from YeRide.",
        ],
      },
      {
        heading: "7. Risk on a ride",
        blocks: [
          "To drive on YeRide you must maintain primary automobile " +
            // copy-gate-allow: the driver's own duty under Fla. Stat. § 627.748(7), stated to the driver — not a claim YeRide carries any; rewrite when #48 lands
            "insurance that meets the requirements of section 627.748(7), " +
            "Florida Statutes, for transportation network company drivers, " +
            "while you are logged on to the network and during every ride.",
          // copy-gate-allow: the honest current position, stated as current — nothing of YeRide's own exists and the terms say so; rewrite when #48 lands
          "YeRide does not currently maintain an automobile insurance policy " +
            // copy-gate-allow: nothing a driver enters is checked, and the terms say so rather than imply otherwise; rewrite when #48 lands
            "of its own, and it does not verify the insurance a driver " +
            "carries. Your own automobile " +
            // copy-gate-allow: § 627.748(8)(a)2's own warning, restated to the driver; rewrite when #48 lands
            "insurance policy might not provide any coverage while you are " +
            "logged on to the network or during a ride, depending on the " +
            "terms of that policy.",
          "A ride is an arrangement between a rider and a driver, and YeRide is " +
            "not a party to it.",
        ],
      },
      {
        heading: "8. What we do not promise",
        blocks: [
          "YeRide is provided as it is. We do not promise that a driver will be " +
            "available, that the app or this website will be uninterrupted or free of " +
            "errors, or that an estimate will match a final fare.",
        ],
      },
      {
        heading: "9. Limits on our liability",
        blocks: [
          "To the fullest extent permitted by Florida law, YeAPP TECH LLC is not " +
            "liable for indirect, incidental, special or consequential damages " +
            "arising out of your use of YeRide, and our total liability on any claim " +
            "is limited to the amount paid for the ride the claim arises from.",
        ],
      },
      {
        heading: "10. Suspension and ending your account",
        blocks: [
          "You can stop using YeRide whenever you like, and you can ask us to delete " +
            "your account — the privacy policy explains how, and what survives it. We " +
            "may suspend or close an account that breaks these terms or where the law " +
            "requires it.",
          "The parts of these terms that by their nature outlast an account — money " +
            "owed, the limits on liability, and governing law — survive it.",
        ],
      },
      {
        heading: "11. Changes to these terms",
        blocks: [
          "We may change these terms. The current version always lives at this " +
            "address, with the date it last changed at the top. Continuing to use " +
            "YeRide after a change means you accept it.",
        ],
      },
      {
        heading: "12. Governing law",
        blocks: [
          "These terms are governed by the laws of the State of Florida, without " +
            "regard to its conflict-of-laws rules. Any dispute arising out of them or " +
            "out of your use of YeRide goes to the state or federal courts serving " +
            "Broward County or Miami-Dade County, Florida, and both you and YeRide " +
            "agree to that venue.",
        ],
      },
      {
        heading: "13. Contact",
        blocks: [
          "YeAPP TECH LLC, Florida, United States. Write to support@yeride.com about " +
            "anything in these terms.",
        ],
      },
    ],
    governing: GOVERNING_EN,
  },

  es: {
    h1: "Términos de servicio",
    updated: "Última actualización: 10 de agosto de 2026",
    lead:
      "Estos términos constituyen un acuerdo entre usted y YeAPP TECH LLC, una " +
      "sociedad de responsabilidad limitada de la Florida que opera YeRide. " +
      "Cubren www.yeride.com y la aplicación YeRide. Al crear una cuenta, al " +
      "tomar un viaje o al conducir uno, usted los acepta.",
    sections: [
      {
        heading: "1. Qué es YeRide",
        blocks: [
          "YeRide es una plataforma tecnológica. Conecta a quienes quieren un viaje " +
            "con conductores independientes que lo prestan. YeRide no presta el " +
            "transporte, no es dueña de los vehículos y no emplea a los conductores.",
          "Los conductores usan YeRide como contratistas independientes. Nada en " +
            "estos términos convierte a un conductor en empleado, agente ni socio de " +
            "YeRide.",
        ],
      },
      {
        heading: "2. Quién puede usarla",
        blocks: [
          "Usted debe tener al menos 18 años y capacidad para celebrar un contrato. " +
            "Se compromete a dar información veraz, a mantenerla actualizada y a no " +
            "compartir su contraseña. Una cuenta por persona. Usted es responsable de " +
            "lo que ocurra bajo su cuenta.",
        ],
      },
      {
        heading: "3. Los viajes",
        blocks: [
          "Un pasajero pide un viaje y un conductor cercano lo acepta. Ninguna de " +
            "las dos partes está obligada: un conductor puede rechazarlo y un " +
            "pasajero puede cancelarlo. Cancelar cuando el conductor ya va en camino " +
            "puede tener un cargo por cancelación, publicado junto con todos los " +
            "demás cargos en nuestro tarifario.",
          "Las tarifas se miden con taxímetro. Se calculan a partir de las tarifas " +
            "publicadas de base, distancia y tiempo del área de servicio, y no se " +
            "pactan de antemano. El estimado de este sitio es un estimado: el " +
            "taxímetro decide.",
        ],
      },
      {
        heading: "4. El pago",
        blocks: [
          // Ver la nota en la versión en inglés: wayfinder #111.
          "Usted paga con tarjeta.",
          "Los pagos con tarjeta los procesa Stripe, y pagar con tarjeta implica " +
            "aceptar también los términos de Stripe.",
          "Cada tarifa que YeRide mide y cada cargo que aplica están publicados en " +
            "el tarifario, en www.yeride.com/es/fees. Un cambio en ellos entra en " +
            "vigor cuando se publica allí.",
        ],
      },
      {
        heading: "5. Si usted conduce",
        blocks: [
          "Para conducir en YeRide usted debe tener una licencia de conducir " +
            "vigente, estar legalmente habilitado para transportar pasajeros donde " +
            "opera y registrar un vehículo que esté autorizado a conducir. Usted es " +
            "responsable de su vehículo, de sus propias licencias y permisos, y de " +
            "sus propios impuestos.",
          "Los pagos se realizan mediante Stripe Connect y están sujetos a los " +
            "términos de Stripe.",
        ],
      },
      {
        heading: "6. Cómo debe comportarse",
        blocks: [
          "YeRide no tolera el contenido objetable ni el comportamiento abusivo. " +
            "Usted se compromete a no publicar, enviar ni compartir contenido que " +
            "sea acosador, de odio, sexualmente explícito, amenazante, violento o " +
            "fraudulento, y a no comportarse de forma abusiva con otro pasajero o " +
            "conductor.",
          "Las normas de convivencia que se muestran en la aplicación al registrarse " +
            "forman parte de estos términos. Cualquier mensaje del chat de un viaje " +
            "puede reportarse, y usted puede bloquear desde el propio chat a la " +
            "persona con la que fue conectado. Las cuentas que hayan publicado " +
            "contenido objetable o se hayan comportado de forma abusiva son retiradas " +
            "de YeRide.",
        ],
      },
      {
        heading: "7. El riesgo de un viaje",
        blocks: [
          "Para conducir en YeRide usted debe mantener un " +
            // copy-gate-allow: el deber propio del conductor bajo Fla. Stat. § 627.748(7), dicho al conductor — no una afirmación de que YeRide tenga alguno; reescribir cuando entre #48
            "seguro de automóvil primario que cumpla los requisitos de la " +
            "sección 627.748(7) de los Estatutos de la Florida para los " +
            "conductores de empresas de redes de transporte, mientras esté " +
            "conectado a la red y durante cada viaje.",
          // copy-gate-allow: la posición honesta de hoy, dicha como actual — YeRide no tiene nada propio en vigor y lo dice; reescribir cuando entre #48
          "YeRide no mantiene actualmente una póliza de seguro de automóvil " +
            // copy-gate-allow: nada de lo que el conductor escribe se comprueba, y los términos lo dicen en vez de sugerir lo contrario; reescribir cuando entre #48
            "propia, y no verifica el seguro que un conductor tenga " +
            "contratado. Su propia " +
            // copy-gate-allow: la advertencia del propio § 627.748(8)(a)2, dicha al conductor; reescribir cuando entre #48
            "póliza de seguro de automóvil podría no ofrecerle ninguna " +
            // copy-gate-allow: continuación de la misma advertencia del § 627.748(8)(a)2; reescribir cuando entre #48
            "cobertura mientras usted esté conectado a la red o durante un " +
            "viaje, según los términos de esa " +
            // copy-gate-allow: cierre de la misma advertencia; reescribir cuando entre #48
            "póliza.",
          "Un viaje es un acuerdo entre un pasajero y un conductor, y YeRide no " +
            "es parte de él.",
        ],
      },
      {
        heading: "8. Lo que no prometemos",
        blocks: [
          "YeRide se ofrece tal como está. No prometemos que haya un conductor " +
            "disponible, que la aplicación o este sitio funcionen sin interrupciones " +
            "ni errores, ni que un estimado coincida con la tarifa final.",
        ],
      },
      {
        heading: "9. Límites de nuestra responsabilidad",
        blocks: [
          "En la máxima medida permitida por la ley de la Florida, YeAPP TECH LLC no " +
            "responde por daños indirectos, incidentales, especiales o " +
            "consecuenciales derivados del uso de YeRide, y nuestra responsabilidad " +
            "total ante cualquier reclamo se limita al monto pagado por el viaje del " +
            "que surge el reclamo.",
        ],
      },
      {
        heading: "10. Suspensión y cierre de su cuenta",
        blocks: [
          "Usted puede dejar de usar YeRide cuando quiera y puede pedirnos que " +
            "eliminemos su cuenta; la política de privacidad explica cómo hacerlo y " +
            "qué sobrevive a ello. Nosotros podemos suspender o cerrar una cuenta que " +
            "incumpla estos términos o cuando la ley lo exija.",
          "Las partes de estos términos que por su naturaleza duran más que una " +
            "cuenta —el dinero adeudado, los límites de responsabilidad y la ley " +
            "aplicable— le sobreviven.",
        ],
      },
      {
        heading: "11. Cambios a estos términos",
        blocks: [
          "Podemos cambiar estos términos. La versión vigente está siempre en esta " +
            "dirección, con la fecha de su último cambio en la parte superior. Seguir " +
            "usando YeRide después de un cambio significa que usted lo acepta.",
        ],
      },
      {
        heading: "12. Ley aplicable",
        blocks: [
          "Estos términos se rigen por las leyes del Estado de la Florida, sin " +
            "atender a sus normas de conflicto de leyes. Cualquier disputa que surja " +
            "de ellos o del uso que usted haga de YeRide se somete a los tribunales " +
            "estatales o federales que atienden el Condado de Broward o el Condado de " +
            "Miami-Dade, Florida, y tanto usted como YeRide aceptan esa jurisdicción.",
        ],
      },
      {
        heading: "13. Contacto",
        blocks: [
          "YeAPP TECH LLC, Florida, Estados Unidos. Escriba a support@yeride.com por " +
            "cualquier asunto de estos términos.",
        ],
      },
    ],
    governing: GOVERNING_ES,
  },
};

/**
 * /delete-account and /es/delete-account — the web account-deletion request
 * page (yeapptech/yeride-mobile#240).
 *
 * WHY IT EXISTS, and why the in-app path is not enough: Play's account
 * deletion requirements are CONJUNCTIVE. An app that allows account creation
 * must provide an in-app deletion path AND a web link where deletion can be
 * requested, because a user who has already uninstalled cannot reach the
 * in-app one. The URL is a required field of the Play Data safety form, so
 * yeride-mobile#125 cannot be completed without this page existing.
 *
 * It does NOT have to be a self-serve form, and deliberately is not: the
 * request channel is support@yeride.com, matching the intake the rest of the
 * site already publishes.
 *
 * ── The retention list is a legal claim, not copy ──────────────────────
 *
 * 🔴 The retain/delete split below is TRANSCRIBED from the doc of record —
 * `docs/LAUNCH_PLAN.md` §5.1 in yeapptech/yeride-mobile — and must not be
 * re-derived here or paraphrased from memory. It changed three times in five
 * days (#252, then #253, then #478). A page promising erasure of everything
 * would be false; so would one that under-states what survives.
 *
 * The in-app notice enumerates SEVEN retained categories after #253 Q1 = A
 * (ratified 2026-09-06). This page carries the same set, in the same terms.
 * Two constraints bind the wording specifically, and both are recorded on
 * yeride-mobile#240:
 *
 *   1. 🔴 The block-list line must claim a RECORD, never ongoing protection.
 *      A returning user registers under a fresh uid, so a retained entry
 *      never blocks anyone again. The app pins this with a
 *      BLOCK_PROMISES_PROTECTION regex set in DeleteAccountModal.test.tsx;
 *      a web page has no such guard, so it is on the author.
 *   2. 🔴 The record is PSEUDONYMOUS, not anonymous. The UID is kept as a
 *      join key by explicit §5.1 design, which is why it earns its own
 *      clause — "you appear as Deleted User" alone reads as anonymisation.
 *
 * ⚠️ The saved-card sentence is #478's, decided 2026-09-10 and merged as
 * yeride-mobile#485. Stripe customer deletion is BEST-EFFORT and
 * non-recovering, so the page says cards are removed from the app and
 * deletion is REQUESTED at the payment processor. It must not say saved
 * payment methods are permanently deleted — that is the exact claim #478
 * removed from the app.
 *
 * ⚠️ Adding a category is cheap; removing one is a filing change, not a copy
 * tweak. Do not narrow this page ahead of the deploy that makes the
 * narrowing true (the events push-token scrub is yeride-functions#137).
 *
 * ── The sentinel is quoted exactly ─────────────────────────────────────
 *
 * "Deleted User" — capital U, DELETED_FIRST_NAME + DELETED_LAST_NAME in
 * yeride-functions. §5.1 records that the lower-case spelling appearing
 * elsewhere was a typo.
 *
 * ── Register ───────────────────────────────────────────────────────────
 *
 * Formal, matching the other two legal documents: the ES version addresses
 * the reader as *usted* throughout.
 */
export const deletionCopy: Record<Lang, LegalDoc> = {
  en: {
    h1: "Delete your YeRide account",
    updated: "Last updated: 10 September 2026",
    lead:
      "You can delete your YeRide account and its associated data at any time. " +
      "The fastest way is from inside the YeRide app. If you have already " +
      "uninstalled it, or you would rather we did it for you, write to us and " +
      "we will handle the request.",
    sections: [
      {
        heading: "1. Delete it yourself, in the app",
        blocks: [
          "This takes effect immediately and needs nothing from us:",
          [
            "Open the YeRide app and sign in.",
            "Go to Profile.",
            "Scroll to the bottom and choose Delete Account.",
            "Confirm with your password. Your account is deleted right away.",
          ],
          "You cannot delete your account while a ride is in progress. Finish " +
            "or cancel the ride first, then try again.",
        ],
      },
      {
        heading: "2. Ask us to delete it",
        blocks: [
          "If you no longer have the app installed, email support@yeride.com " +
            "from the address on your YeRide account and ask us to delete it. " +
            "Say that you want your account deleted so we can tell it apart " +
            "from other support mail.",
          "We may ask you to confirm one or two details before we act, so that " +
            "nobody can close somebody else's account by writing to us. Once " +
            "confirmed, we delete it for you and reply to tell you it is done.",
        ],
      },
      {
        heading: "3. What is deleted",
        blocks: [
          "Deleting your account removes, straight away and with no grace period:",
          [
            "Your sign-in credentials — you can no longer log in.",
            "Your profile: name, email address, phone number and profile photo.",
            "Your saved locations.",
            "Your device's push-notification registration.",
            "For drivers: your vehicles and their photos.",
          ],
          "Saved cards are removed from the app and deletion is requested at " +
            "the payment processor. We ask; the processor carries it out on its " +
            "own terms, so we describe what we do rather than promising an " +
            "outcome we do not control.",
        ],
      },
      {
        heading: "4. What is kept, and why",
        blocks: [
          "Some records survive account deletion. We keep them because a trip " +
            "involves two people and is a financial and safety record for both " +
            "of you — one person leaving cannot erase the other's copy of what " +
            "happened. This is the full list:",
          [
            "Your trip history is kept. On those trips you appear as " +
              "“Deleted User” rather than by name.",
            "Chat messages you sent are kept, along with the name you sent " +
              "them under.",
            "Technical records attached to those trips: payment references and " +
              "your device's notification token.",
            "An internal ID that links you to those records. It is not your " +
              "name, but it is not nothing either — it is what ties the trips " +
              "together.",
            "Your name can also remain in a trip's activity log, which is the " +
              "record of what happened on that trip.",
            "Safety reports are kept — both ones you sent and ones about " +
              "you, including the reason chosen, what you wrote and the message " +
              "text they quote.",
            "If someone blocked you, their block list keeps a record of it. " +
              "That is their record of a past decision; it does not follow you " +
              "and it does not stop you signing up again.",
          ],
          "Drivers: your payout account with our payment processor is kept, and " +
            "the vehicle details on your trips — including the licence " +
            "plate — stay on those trip records.",
          "Because of the internal ID above, what remains is pseudonymous " +
            "rather than anonymous: it no longer carries your name, but it is " +
            "still a linked set of records.",
        ],
      },
      {
        heading: "5. How long it takes",
        blocks: [
          "Deleting from inside the app is immediate. There is no waiting " +
            "period and no way to undo it, so be sure before you confirm.",
          "A request by email takes as long as it takes us to confirm who you " +
            "are, and we aim to reply within a few days.",
        ],
      },
      {
        heading: "6. Questions",
        blocks: [
          "Write to support@yeride.com. If you want to know what we hold about " +
            "you before deciding, ask — our privacy policy at " +
            "www.yeride.com/privacy-policy sets out the rest.",
        ],
      },
    ],
    governing: GOVERNING_EN,
  },
  es: {
    h1: "Elimine su cuenta de YeRide",
    updated: "Última actualización: 10 de septiembre de 2026",
    lead:
      "Usted puede eliminar su cuenta de YeRide y los datos asociados cuando " +
      "quiera. La forma más rápida es desde la propia aplicación " +
      "de YeRide. Si ya la desinstaló, o prefiere que lo hagamos nosotros, " +
      "escríbanos y nos encargamos de la solicitud.",
    sections: [
      {
        heading: "1. Eliminarla usted mismo, en la aplicación",
        blocks: [
          "Surte efecto de inmediato y no requiere nada de nuestra parte:",
          [
            "Abra la aplicación de YeRide e inicie sesión.",
            "Vaya a Perfil.",
            "Baje hasta el final y elija Eliminar cuenta.",
            "Confirme con su contraseña. La cuenta se elimina en el acto.",
          ],
          "No es posible eliminar la cuenta mientras hay un viaje en curso. " +
            "Termine o cancele el viaje y vuelva a intentarlo.",
        ],
      },
      {
        heading: "2. Pedirnos que la eliminemos",
        blocks: [
          "Si ya no tiene la aplicación instalada, escriba a " +
            "support@yeride.com desde el correo de su cuenta de YeRide y " +
            "pídanos que la eliminemos. Indique que desea eliminar su " +
            "cuenta, para distinguir su mensaje del resto del correo de soporte.",
          "Es posible que le pidamos confirmar uno o dos datos antes de actuar, " +
            "para que nadie pueda cerrar la cuenta de otra persona " +
            "escribiéndonos. Una vez confirmado, la eliminamos y le " +
            "respondemos para avisarle.",
        ],
      },
      {
        heading: "3. Qué se elimina",
        blocks: [
          "Al eliminar su cuenta se borra, de inmediato y sin período de " +
            "gracia:",
          [
            "Sus credenciales de acceso: ya no podrá iniciar sesión.",
            "Su perfil: nombre, correo electrónico, teléfono y foto.",
            "Sus ubicaciones guardadas.",
            "El registro de notificaciones de su dispositivo.",
            "Para conductores: sus vehículos y sus fotos.",
          ],
          "Las tarjetas guardadas se eliminan de la aplicación y se " +
            "solicita su eliminación al procesador de pagos. Nosotros lo " +
            "solicitamos; el procesador lo ejecuta según sus propias " +
            "condiciones, así que describimos lo que hacemos en lugar de " +
            "prometer un resultado que no controlamos.",
        ],
      },
      {
        heading: "4. Qué se conserva, y por qué",
        blocks: [
          "Algunos registros sobreviven a la eliminación de la cuenta. Los " +
            "conservamos porque un viaje involucra a dos personas y es un " +
            "registro financiero y de seguridad para ambas: que una se vaya no " +
            "puede borrar la copia que la otra tiene de lo ocurrido. Esta es la " +
            "lista completa:",
          [
            "Su historial de viajes se conserva. En esos viajes usted aparece " +
              "como “Deleted User” y no con su nombre.",
            "Los mensajes de chat que envió se conservan, junto con el " +
              "nombre con el que los envió.",
            "Registros técnicos asociados a esos viajes: referencias de " +
              "pago y el token de notificaciones de su dispositivo.",
            "Un identificador interno que lo vincula con esos registros. No es " +
              "su nombre, pero tampoco es nada: es lo que mantiene unidos los " +
              "viajes.",
            "Su nombre también puede permanecer en el registro de " +
              "actividad de un viaje, que es la constancia de lo que " +
              "ocurrió en ese viaje.",
            "Los reportes de seguridad se conservan — tanto los que usted " +
              "envió como los que hablan de usted, incluido el motivo " +
              "elegido, lo que usted escribió y el texto del mensaje que " +
              "citan.",
            "Si alguien lo bloqueó, su lista de bloqueados conserva una " +
              "constancia de ello. Es la constancia de una decisión pasada " +
              "de esa persona; no lo sigue a usted ni le impide registrarse de " +
              "nuevo.",
          ],
          "Conductores: su cuenta de pagos con nuestro procesador se conserva, " +
            "y los datos del vehículo en sus viajes — incluida la " +
            "placa — permanecen en esos registros de viaje.",
          "Por el identificador interno anterior, lo que queda es " +
            "seudónimo y no anónimo: ya no lleva su nombre, pero " +
            "sigue siendo un conjunto de registros vinculados.",
        ],
      },
      {
        heading: "5. Cuánto tarda",
        blocks: [
          "Eliminarla desde la aplicación es inmediato. No hay período " +
            "de espera ni forma de deshacerlo, así que asegúrese " +
            "antes de confirmar.",
          "Una solicitud por correo tarda lo que tardemos en confirmar su " +
            "identidad, y procuramos responder en unos pocos días.",
        ],
      },
      {
        heading: "6. Preguntas",
        blocks: [
          "Escriba a support@yeride.com. Si antes de decidir quiere saber " +
            "qué datos tenemos sobre usted, pídalo — nuestra " +
            "política de privacidad en www.yeride.com/es/privacy-policy " +
            "explica el resto.",
        ],
      },
    ],
    governing: GOVERNING_ES,
  },
};
