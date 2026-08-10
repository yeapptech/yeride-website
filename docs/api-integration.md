# API Integration

This document describes the API integration for the YeRide website.

## Overview

The site talks to **two unrelated services**. Don't conflate them — they are different
repositories, different hosts, different failure modes, and a change to one says
nothing about the other.

| | Pre-registration | Fares and fees |
|---|---|---|
| Repo | [yeride-admin-api](https://github.com/yeapptech/yeride-admin-api) | [yeride-functions](https://github.com/yeapptech/yeride-functions) |
| Called from | `src/components/PreRegistrationForm.astro` | `src/lib/fareEstimate.ts`, `src/lib/feeSchedule.ts` |
| Shape | plain `fetch` POST to `${PUBLIC_API_URL}v1/auth/register` | Firebase callable `estimateFares` (region `us-east1`); HTTP `getFeeSchedule` |
| Pages | `/drivers`, `/riders` | `/fare-estimate`, `/fees` |
| What it does | writes a `whitelist` row — **it does not create an account** | quotes a fare; publishes the rate card the meter itself uses |

Firebase **Auth and Firestore are not used** — only `firebase/functions`.

The rest of this page covers pre-registration. The fare and fee side is documented
where the decisions live: `src/lib/fareEstimate.ts` (read its header before adding
`appCharges`/`appChargesTotal` back — they were withdrawn from the wire on purpose),
`src/lib/serviceArea.ts` (which market a rider is quoted at, and its three states),
and [Components](./components.md) for `FeeSchedule` and `FareEstimatePage`.

## Configuration

### Environment Variable

The API base URL is configured via `PUBLIC_API_URL`. Its real value is in
[`.env.example`](../.env.example) — this page deliberately does not restate it, so
there is only one place for it to be wrong.

> **Important:** The URL must end with a trailing slash (`/`). `scripts/check-env.mjs`
> fails the build without it, because the form appends `v1/auth/register` straight
> onto the value.

### Setting Up Locally

Copy the committed example, which carries the real value for this variable:

```bash
cp .env.example .env
```

### Production Configuration

For production (GitHub Actions), set the `PUBLIC_API_URL` secret in the repository settings:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add `PUBLIC_API_URL` as a repository secret

`PUBLIC_API_URL` is one of six required `PUBLIC_*` secrets; the build fails on any
missing or empty one (`scripts/check-env.mjs`). The list is `.env.example`.

## API Endpoints

### User Registration

**Endpoint:** `POST {PUBLIC_API_URL}v1/auth/register`

Registers a new user for the YeRide whitelist.

> **This endpoint is not answering in production** (checked 2026-08-10, #42). The host
> `PUBLIC_API_URL` resolves to returns the Google frontend's "404 Page not found" for
> every path and every method — byte for byte what a `*.a.run.app` hostname with no
> service behind it returns, and `*.a.run.app` is wildcard DNS, so resolving proves
> nothing. Not a CORS problem and not a routing problem: there is nothing to route to.
> Every pre-registration from the live site therefore fails and shows the generic
> network-failure line. Tracked as
> [yeride-admin-api#5](https://github.com/yeapptech/yeride-admin-api/issues/5) — which
> was filed on the narrower CORS reading; this is one layer earlier and worse. Confirm
> against the deployed service before changing anything here.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+11234567890",
    "role": "rider"
  }
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | Yes | User's first name |
| `lastName` | string | Yes | User's last name |
| `email` | string | Yes | Valid email address |
| `phoneNumber` | string | Yes | E.164. A bare ten digits is read as NANP and sent as `+1…`; a `+`-prefixed number is validated as E.164 and sent unchanged |
| `role` | string | Yes | Either `rider` or `driver` |

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Registration successful"
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Client-Side Implementation

### Where it is written

The form is a **bundled** `<script>` in `src/components/PreRegistrationForm.astro`,
reading `import.meta.env.PUBLIC_API_URL` directly (wayfinder #37 replaced the old
`is:inline` + `define:vars` script). Its copy — every label, placeholder and error
line, EN and ES — is in `src/i18n/formCopy.ts`.

This page **does not restate that logic.** It used to: a `submitForm`, a
`formatPhoneNumber` and a `validateForm` sample sat here, and by the time #42 swept
them both of the interesting ones were wrong. `formatPhoneNumber` prepended `+1`
unconditionally, which is exactly what #37 stopped doing — a bare ten digits is
treated as NANP and gets the `+1`, but an already-`+`-prefixed number is validated as
E.164 and left alone, so a non-US number is no longer mangled. And `validateForm`
checked a `role` the person picks, when #37 **deleted the role dropdown**: role is
pre-set by the page, `driver` on `/drivers` and `rider` on `/riders`. Nothing asserted
either sample, which is why they drifted. Read the component.

Two behaviours are worth knowing before you touch it, because both are decisions:

- **`PUBLIC_API_URL` is inlined at build time.** An empty one does not fail at
  runtime — Rollup folds away the branch that tested it and the submit path is *gone
  from the bundle*. `scripts/check-env.mjs` fails the build rather than let that ship
  (#59).
- **A duplicate phone number gets its own error line**, distinct from the generic
  failure, because the endpoint reports it as its own code.

## Testing

### Local Development

Use a mock API URL for local testing:

```bash
PUBLIC_API_URL=http://localhost:5001/yeapp-stage/us-central1/api/
```

### Testing the Form

1. Fill out all required fields
2. Click "Pre-Register"
3. Verify the request in browser DevTools (Network tab)
4. Check for success/error message display

### API Response Simulation

For testing without a backend:

```javascript
// Mock successful response
const mockResponse = {
  success: true,
  message: 'Registration successful'
};

// Mock error response
const mockError = {
  success: false,
  error: 'Email already registered'
};
```

## Security Considerations

### Data Transmission

- All API requests use HTTPS
- Sensitive data is sent via POST body, not URL parameters

### Input Sanitization

- Client-side validation prevents malformed data
- Server-side validation required on the backend

### Rate Limiting

Consider implementing rate limiting on the backend to prevent abuse.

## Related Documentation

- [Backend API Repository](https://github.com/yeapptech/yeride-admin-api) - API source code
- [Deployment Guide](./deployment.md) - Environment variable configuration
- [Components](./components.md) - PreRegistrationForm component details
