## Context

The application has JWT-based authentication (AB-1002) but no mechanism for users to recover a forgotten password. The chosen approach uses a short-lived one-time password (OTP) sent out-of-band. For this iteration, the OTP is logged to the console instead of dispatched via email, keeping the scope tight and deferring the email provider integration.

The existing stack already has bcryptjs for hashing and Prisma for DB access. No new runtime dependencies are required.

## Goals / Non-Goals

**Goals:**
- `POST /api/auth/forgot-password` — generate and store a 6-digit OTP tied to the requesting email, log it to console, always return 200 (anti-enumeration)
- `POST /api/auth/reset-password` — validate email + OTP + expiry, hash and persist new password, mark OTP as used
- New `PasswordResetOtp` Prisma model with `email`, `code`, `expiresAt`, `usedAt?`
- Shared Zod schemas `ForgotPasswordSchema` and `ResetPasswordSchema` in `packages/shared`
- Deterministic failure modes: expired OTP → 400, invalid/used OTP → 400, unknown email → 200 (silent)

**Non-Goals:**
- Email delivery via SMTP / SendGrid / SES (deferred — log to console only)
- SMS or push-based OTP delivery
- Multi-factor authentication
- OAuth / social login recovery
- OTP rate limiting (deferred to infrastructure layer)
- Frontend UI for the reset flow

## Decisions

### 1. 6-Digit Numeric OTP (vs. UUID token)

**Decision**: Generate a cryptographically random 6-digit numeric code using `crypto.randomInt(100000, 999999)`.

**Rationale**: 6-digit codes are the industry norm for OTP flows (TOTP, SMS codes). They're short enough for manual entry and have 900,000 possible values — sufficient for a 15-minute window with no brute-force protection at the transport layer. `crypto.randomInt` is cryptographically secure and ships with Node.js (no new dependency).

**Alternatives considered**:
- *UUID token in URL*: More secure for email links, but email delivery is out of scope; manual entry of a UUID is unusable.
- *TOTP (time-based)*: Requires shared secret per user and a TOTP library; overkill for this use case.

---

### 2. Store OTP in a Separate `password_reset_otps` Table (vs. on the User model)

**Decision**: New `PasswordResetOtp` Prisma model with its own table.

**Rationale**: Keeping OTPs separate from the `users` table is cleaner — a user can have at most one active OTP at a time, and old records can be pruned independently. It avoids adding nullable columns to the core user row and keeps the concern isolated.

**Alternatives considered**:
- *Nullable columns on User (`resetOtp`, `resetOtpExpiresAt`)*: Simpler but couples password-reset state to the core user record; harder to add multiple OTP types later.

---

### 3. Always Return 200 for `forgot-password` (Anti-Enumeration)

**Decision**: `POST /api/auth/forgot-password` always returns `200 { success: true }` regardless of whether the email exists in the database.

**Rationale**: Returning 404 for unknown emails leaks information about registered accounts. This is the same defensive pattern used in the login endpoint (AB-1002).

---

### 4. 15-Minute OTP Expiry

**Decision**: OTPs expire 15 minutes after generation.

**Rationale**: 15 minutes is the standard window for OTP-based password resets — long enough for a user to act, short enough to limit the exposure window if the code is intercepted. The expiry is enforced server-side at the `expiresAt` field; no background cleanup job is required for correctness (expired rows are simply rejected).

---

### 5. Single Active OTP Per Email (Upsert / Replace on Re-request)

**Decision**: If a user requests a reset while an unused OTP already exists, replace it with a new one (upsert on email).

**Rationale**: Prevents accumulation of stale OTP rows, simplifies lookup (always one active record per email), and implicitly invalidates older codes if a user requests multiple times.

---

### 6. Log OTP to Console (vs. No-Op)

**Decision**: `console.log(`[OTP] Reset code for ${email}: ${code}`)` during development/testing.

**Rationale**: Logging the code to stdout is the minimal viable approach that lets developers and testers exercise the full reset flow without an email provider. A real delivery adapter is trivially swappable — replace the `console.log` call with a mailer call in a future ticket.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| OTP brute-force (900k space, no rate limit) | Rate limiting deferred to infra layer; 15-min window limits exposure; acceptable for MVP |
| Console-logged OTPs leak in production logs | The log statement is clearly marked and easily removed; a future ticket wires real email |
| Stale OTP rows accumulate in DB | Replaced on re-request (upsert); expired rows are harmless; a periodic cleanup job is a future concern |
| User resets password for an account they don't own | OTP is tied to email; attacker must first receive the OTP — logging to console makes this a non-issue in dev |

## Migration Plan

1. Add `PasswordResetOtp` Prisma model to `schema.prisma`
2. Run `prisma migrate dev --name add-password-reset-otps`
3. Add `ForgotPasswordSchema` and `ResetPasswordSchema` to `packages/shared` and rebuild
4. Implement handler and router, mount at `/api/auth`
5. No rollback risk — net-new table, no modifications to existing tables

## Open Questions

- Should OTP attempts be counted and the code invalidated after N failures? → Deferred to rate-limiting ticket.
- Should `usedAt` be stored for audit purposes, or should the row be deleted on successful reset? → Store `usedAt` for now (simpler, auditable).
