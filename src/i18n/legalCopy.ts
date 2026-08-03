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
//   5. THE TERMS STATE PLAINLY THAT YERIDE PROVIDES NO INSURANCE — see the
//      copy-gate note below.
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
// is a line matcher, so it cannot tell a CLAIM from a DENIAL — and a terms page
// whose job is to say there is no insurance has to say it. Those lines carry an
// explicit `copy-gate-allow` naming #48, so every one of them prints on every
// build. When #48 lands the statements become FALSE and must be rewritten, not
// merely un-pragma'd; that is why #48 is the right ticket to hang them on.
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
          "This site sets no cookies. It runs no analytics, no advertising and no " +
            "third-party tracking of any kind, and it stores nothing in your browser.",
          "The message form on our contact page is hosted by Tally. What you type " +
            "into it goes to Tally, who deliver it to us.",
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
            "Your location — while you are using the app, YeRide collects your " +
              "device's precise location. For a driver on a trip this continues " +
              "while the app is in the background, because a trip has to be tracked " +
              "to its end. Location is what matches riders to nearby drivers, " +
              "measures distance and duration, and draws the route.",
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
            "Payment — card details are entered into Stripe, not into YeRide. We " +
              "never see or store a card number; Stripe holds the card and gives us " +
              "only a reference that lets us charge it for a ride. Drivers are paid " +
              "through Stripe Connect, and the identity and tax information Stripe " +
              "needs in order to pay a driver goes to Stripe directly — it does not " +
              "reach us. When a rider pays cash, the money goes to the driver and we " +
              "record only that the ride was paid in cash.",
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
            "Tally — the message form on our contact page.",
            "Apple and Google — delivery of push notifications to your device.",
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
          "Nothing is deleted automatically. There is no expiry timer on a " +
            "pre-registration entry, a trip record or a stored location. If you want " +
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
            "location and your rider payment record at Stripe. Completed trips stay, " +
            "with your name and contact details stripped out of them: both sides of " +
            "a ride have a financial record of it, and the tax and accounting " +
            "obligations on it outlast the account. A driver's Stripe payout account " +
            "stays for the same reason.",
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
          "Este sitio no utiliza cookies. No ejecuta analítica, ni publicidad, ni " +
            "rastreo de terceros de ningún tipo, y no guarda nada en su navegador.",
          "El formulario de mensajes de nuestra página de contacto está alojado por " +
            "Tally. Lo que usted escriba allí llega a Tally, que nos lo entrega.",
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
            "Su ubicación: mientras usted usa la aplicación, YeRide recopila la " +
              "ubicación precisa de su dispositivo. En el caso de un conductor " +
              "durante un viaje, esto continúa con la aplicación en segundo plano, " +
              "porque un viaje debe rastrearse hasta el final. La ubicación es lo que " +
              "conecta a los pasajeros con conductores cercanos, mide la distancia y " +
              "la duración, y traza la ruta.",
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
            "Pago: los datos de la tarjeta se ingresan en Stripe, no en YeRide. " +
              "Nunca vemos ni guardamos un número de tarjeta; Stripe conserva la " +
              "tarjeta y nos entrega solamente una referencia que nos permite " +
              "cobrarla por un viaje. A los conductores se les paga mediante Stripe " +
              "Connect, y la información de identidad y tributaria que Stripe " +
              "necesita para pagarle a un conductor va directamente a Stripe: no " +
              "llega hasta nosotros. Cuando un pasajero paga en efectivo, el dinero " +
              "va al conductor y nosotros solo registramos que el viaje se pagó en " +
              "efectivo.",
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
            "Tally: el formulario de mensajes de nuestra página de contacto.",
            "Apple y Google: la entrega de notificaciones a su dispositivo.",
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
          "Nada se elimina automáticamente. No hay un plazo de caducidad sobre un " +
            "prerregistro, sobre el registro de un viaje ni sobre una ubicación " +
            "guardada. Si usted quiere que sus datos desaparezcan, pídanoslo: ese es " +
            "todo el mecanismo, y se describe a continuación.",
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
            "Stripe. Los viajes completados permanecen, con su nombre y sus datos de " +
            "contacto retirados: ambas partes de un viaje tienen un registro " +
            "financiero de él, y las obligaciones tributarias y contables que recaen " +
            "sobre ese registro duran más que la cuenta. La cuenta de pagos en " +
            "Stripe de un conductor permanece por la misma razón.",
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
    updated: "Last updated: 2 August 2026",
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
          "You can pay by card or in cash.",
          "Card payments are processed by Stripe, and paying by card means accepting " +
            "Stripe's terms as well as these. Cash is handed to the driver directly; " +
            "YeRide is not part of that exchange beyond recording that the ride was " +
            "paid in cash.",
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
          // copy-gate-allow: the denial the gate exists to protect — YeRide has none and says so; rewrite when #48 lands
          "YeRide does not provide insurance for rides, riders, drivers or vehicles.",
          "Each driver is responsible for carrying whatever their vehicle and their " +
            "driving require of them by law. A ride is an arrangement between a rider " +
            "and a driver, and YeRide is not a party to it.",
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
    updated: "Última actualización: 2 de agosto de 2026",
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
          "Usted puede pagar con tarjeta o en efectivo.",
          "Los pagos con tarjeta los procesa Stripe, y pagar con tarjeta implica " +
            "aceptar también los términos de Stripe. El efectivo se le entrega " +
            "directamente al conductor; YeRide no participa en ese intercambio más " +
            "allá de registrar que el viaje se pagó en efectivo.",
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
          // copy-gate-allow: la negación que la compuerta existe para proteger — YeRide no tiene ninguno y lo dice; reescribir cuando entre #48
          "YeRide no ofrece ningún seguro para los viajes, los pasajeros, los conductores ni los vehículos.",
          "Cada conductor es responsable de contar con lo que la ley le exija por su " +
            "vehículo y por su conducción. Un viaje es un acuerdo entre un pasajero y " +
            "un conductor, y YeRide no es parte de él.",
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
