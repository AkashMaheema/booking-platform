# Security Documentation

## Overview

This document describes the security architecture of the EN2H Booking Platform API. The implementation follows [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) best practices.

---

## Authentication

### JWT Access Tokens

- **Algorithm**: HS256 (HMAC-SHA256)
- **Expiry**: 15 minutes (configurable via `JWT_EXPIRES_IN`)
- **Secret**: Stored exclusively in `JWT_SECRET` environment variable (min 32 chars)
- **Transmission**: Bearer token in `Authorization` header only — never in URL parameters or cookies

### Refresh Tokens

- **Expiry**: 7 days (configurable via `REFRESH_EXPIRES_IN`)
- **Storage**: SHA-256 hash of the raw token stored in the database — the plaintext is never persisted
- **Rotation**: Each call to `/auth/refresh` invalidates the previous refresh token and issues a new pair
- **Revocation**: All refresh tokens are revoked on logout
- **Secret**: Stored exclusively in `REFRESH_SECRET` environment variable (min 32 chars)

### Token Validation Flow

```
Client Request
    │
    ▼
JwtAuthGuard
    │── @Public() route? ──► Allow
    │
    ▼
passport-jwt Strategy
    │── Invalid signature ──► 401 Unauthorized
    │── Expired token     ──► 401 Unauthorized
    │── User not active   ──► 401 Unauthorized
    │
    ▼
RolesGuard (if @Roles() applied)
    │── Missing role ──► 403 Forbidden
    │
    ▼
Route Handler
```

---

## Password Security

| Property | Value |
|---|---|
| Library | bcrypt |
| Salt rounds | 12 |
| Storage | Hashed only — never plaintext |
| Logging | Passwords are NEVER logged |
| API responses | Password field is NEVER returned |

### Login Protection

- A **generic error message** ("Invalid email or password.") is returned for both wrong email and wrong password
- This prevents **user enumeration attacks** — an attacker cannot determine whether an email exists

---

## Rate Limiting

Implemented via `@nestjs/throttler`:

| Endpoint Group | Limit | Window |
|---|---|---|
| `POST /auth/login` | 5 requests | 60 seconds |
| `POST /auth/register` | 5 requests | 60 seconds |
| `POST /auth/refresh` | 5 requests | 60 seconds |
| All other endpoints | 100 requests | 60 seconds |

Exceeding the limit returns `429 Too Many Requests`.

---

## Security Headers

Implemented via `helmet`:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `no-referrer` |
| `X-Powered-By` | Removed |
| `Strict-Transport-Security` | Enabled (helmet default) |

---

## CORS

```typescript
app.enableCors({
  origin: process.env['CORS_ORIGIN']?.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

- Wildcard (`*`) origins are **never** permitted in production
- Origins are sourced exclusively from the `CORS_ORIGIN` environment variable
- Multiple origins can be specified as a comma-separated list

---

## Input Validation

All incoming request bodies are validated via NestJS `ValidationPipe`:

```typescript
new ValidationPipe({
  whitelist: true,              // Strip unknown properties
  forbidNonWhitelisted: true,  // Reject requests with extra fields
  transform: true,              // Auto-transform to DTO types
})
```

Validation rejects:

- Missing required fields → `400`
- Invalid email addresses → `400`
- Negative prices → `400`
- Invalid date formats → `400`
- Invalid enum values → `400`
- Extra / unknown properties → `400`

---

## Error Handling

The global exception filter ensures no sensitive information is leaked:

| Sensitive Info | Behaviour |
|---|---|
| Stack traces | **Never** returned in API responses |
| Database queries | **Never** returned in API responses |
| Prisma error codes | Mapped to safe generic messages |
| Internal file paths | **Never** included in error messages |
| JWT secrets | **Never** included in error messages |
| Environment variables | **Never** included in error messages |

### Standard Error Response Shape

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "errors": [],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/services",
  "requestId": "req-uuid-here"
}
```

---

## Database Security

- All database operations use **Prisma ORM with parameterised queries**
- Raw SQL string concatenation is strictly forbidden
- Prisma automatically prevents SQL injection by binding parameters
- Database credentials are stored exclusively in `DATABASE_URL` environment variable

---

## CSRF Protection

This API uses **stateless JWT Bearer token authentication**. CSRF protection is **not required** because:

1. Tokens are stored in memory or `localStorage` (not in cookies)
2. Cross-origin requests **cannot** access tokens stored in another origin
3. The `Authorization: Bearer <token>` header cannot be set by cross-origin HTML forms
4. No session cookies are used

> ⚠️ **Future Note**: If cookie-based session management or authentication cookies are introduced, CSRF protection (e.g. double-submit cookie pattern or CSRF tokens) **must** be implemented.

---

## XSS Protection

- All user input is validated and sanitised by the ValidationPipe before processing
- The `helmet` middleware sets `X-Content-Type-Options: nosniff` to prevent MIME-type sniffing
- `X-Frame-Options: SAMEORIGIN` prevents clickjacking attacks
- API responses are `application/json` — the browser will not execute JSON as HTML
- No server-side template rendering is used, eliminating server-side XSS risk

---

## Logging Security

The following values are **never** logged:

- User passwords (plaintext or hashed)
- JWT access tokens
- JWT refresh tokens
- `Authorization` request headers (full value)
- Database connection strings

Audit logs include only:
- User ID
- Action performed
- Resource affected
- Request ID (for tracing)
- Timestamp

---

## Environment Variable Validation

All required environment variables are validated on application startup using **Joi**. If any required variable is missing or invalid, the application **will not start**:

```
Error: JWT_SECRET must be at least 32 characters
```

This prevents accidentally running the application with insecure defaults.

---

## Dependency Security

Run the following to audit dependencies:

```bash
npm audit
```

Fix high/critical vulnerabilities:

```bash
npm audit fix
```

For forced fixes (breaking changes — review carefully):

```bash
npm audit fix --force
```

---

## Security Testing

The test suite verifies:

| Scenario | Expected Behaviour |
|---|---|
| Unauthenticated request to protected endpoint | `401 Unauthorized` |
| Invalid JWT token | `401 Unauthorized` |
| Expired JWT token | `401 Unauthorized` |
| Valid JWT, insufficient role | `403 Forbidden` |
| Invalid request body | `400 Bad Request` |
| Invalid enum value | `400 Bad Request` |
| Extra properties in request body | `400 Bad Request` |
| Password not returned in response | Password field absent |
| Stack trace not in error response | Stack absent |

Run security tests:

```bash
npm run test -- --testPathPattern=security
```

---

## Roles & Authorization

The application is designed to be future-ready for role-based access control:

| Role | Permissions |
|---|---|
| `ADMIN` | Full access — manage services, bookings, delete resources |
| `STAFF` | Create and update services, manage bookings |
| `USER` | Reserved for future customer self-service features |

Adding new role restrictions requires only adding `@Roles(Role.X)` to a controller method — no architectural changes needed.

---

## Security Checklist

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT authentication working
- ✅ Protected routes secured with `JwtAuthGuard`
- ✅ Role-based access with `RolesGuard`
- ✅ `@Public()` decorator for intentionally public routes
- ✅ Global `ValidationPipe` enforces whitelist and strict validation
- ✅ `helmet` configured with security headers
- ✅ CORS restricted to explicit origins (no wildcard)
- ✅ Rate limiting: 5 req/min for auth, 100 req/min globally
- ✅ JWT and refresh secrets from environment variables only
- ✅ No passwords, tokens, or secrets logged
- ✅ Generic error messages prevent user enumeration
- ✅ No stack traces in API responses
- ✅ Prisma parameterised queries (no raw SQL)
- ✅ Refresh token rotation on every refresh
- ✅ Refresh tokens stored as SHA-256 hashes
- ✅ Environment variables validated on startup
- ✅ Swagger authentication configured (`JWT-auth` bearer)
- ✅ Security tests passing
