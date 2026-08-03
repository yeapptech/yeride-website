# API Integration

This document describes the API integration for the YeRide website.

## Overview

The website integrates with the YeRide backend API for user pre-registration. The API handles user data submission and storage.

## Configuration

### Environment Variable

The API base URL is configured via environment variable:

```bash
PUBLIC_API_URL=https://your-api-url.com/
```

> **Important:** The URL must end with a trailing slash (`/`).

### Setting Up Locally

Create a `.env` file in the project root:

```bash
# .env
PUBLIC_API_URL=https://api.yeride.com/
```

### Production Configuration

For production (GitHub Actions), set the `PUBLIC_API_URL` secret in the repository settings:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add `PUBLIC_API_URL` as a repository secret

`PUBLIC_API_URL` is one of six required `PUBLIC_*` secrets; the build fails on any
missing or empty one (`scripts/check-env.mjs`). The full list is in CLAUDE.md.

## API Endpoints

### User Registration

**Endpoint:** `POST {PUBLIC_API_URL}v1/auth/register`

Registers a new user for the YeRide whitelist.

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
| `phoneNumber` | string | Yes | US phone number with +1 prefix |
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

### Form Submission

The `PreRegistrationForm.astro` component handles form submission:

```javascript
async function submitForm(formData) {
  const apiUrl = import.meta.env.PUBLIC_API_URL;

  const response = await fetch(`${apiUrl}v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
}
```

### Phone Number Formatting

Phone numbers are formatted to US standard:

```javascript
function formatPhoneNumber(value) {
  // Remove non-digits except leading +
  let cleaned = value.replace(/[^\d+]/g, '');

  // Ensure +1 prefix
  if (!cleaned.startsWith('+1')) {
    cleaned = '+1' + cleaned.replace(/^\+/, '');
  }

  return cleaned;
}
```

### Validation

Client-side validation is performed before submission:

```javascript
function validateForm(formData) {
  const errors = [];

  if (!formData.firstName.trim()) {
    errors.push('First name is required');
  }

  if (!formData.lastName.trim()) {
    errors.push('Last name is required');
  }

  if (!isValidEmail(formData.email)) {
    errors.push('Valid email is required');
  }

  if (!isValidPhoneNumber(formData.phoneNumber)) {
    errors.push('Valid US phone number is required');
  }

  if (!['rider', 'driver'].includes(formData.role)) {
    errors.push('Please select a role');
  }

  return errors;
}
```

## Error Handling

### Network Errors

```javascript
try {
  const response = await submitForm(formData);
  showSuccessMessage();
} catch (error) {
  if (error.name === 'TypeError') {
    // Network error
    showError('Unable to connect. Please check your internet connection.');
  } else {
    // API error
    showError('Registration failed. Please try again.');
  }
}
```

### User Feedback

The form displays appropriate feedback:

- **Loading:** Spinner and disabled submit button
- **Success:** Green success message
- **Error:** Red error message with description

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
