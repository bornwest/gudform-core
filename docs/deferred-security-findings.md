# Deferred Security Findings

The following findings from the security audit are deferred for later implementation. They are lower severity or require larger architectural changes.

## C1 — CSRF on Server Actions

- **Severity**: Critical
- **Description**: Next.js server actions rely on the framework's built-in CSRF protection (Origin header check). Consider adding explicit CSRF tokens for extra defense-in-depth if the app is deployed behind proxies that strip Origin headers.
- **Recommendation**: Evaluate whether the deployment setup preserves Origin headers. If not, add a custom CSRF token mechanism.

## M1 — Webhook Secret Rotation

- **Severity**: Medium
- **Description**: Webhook secrets are stored but there is no rotation mechanism or expiration policy.
- **Recommendation**: Add a webhook secret rotation action and consider time-limited secrets.

## M2 — Session Fixation

- **Severity**: Medium
- **Description**: Ensure session tokens are regenerated after authentication state changes (login, password change, privilege escalation).
- **Recommendation**: Verify NextAuth session behavior on login and add explicit session regeneration where needed.

## M3 — Input Length Limits on Free-text Fields

- **Severity**: Medium
- **Description**: Some API endpoints accept large payloads (long text answers, descriptions) without strict byte-level limits, potentially enabling resource exhaustion.
- **Recommendation**: Add `maxLength` constraints on all free-text database fields and validate payload sizes at the API layer.

## M4 — File Upload Content Validation

- **Severity**: Medium
- **Description**: File uploads are validated by MIME type but not by content (magic bytes). An attacker could upload a malicious file with a spoofed MIME type.
- **Recommendation**: Add magic byte validation (e.g., using `file-type` package) in addition to MIME type checks.

## M5 — Webhook Delivery Timeout and Retry

- **Severity**: Medium
- **Description**: Webhook delivery has no timeout limit or retry logic with exponential backoff. A slow/unresponsive webhook endpoint could block submission processing.
- **Recommendation**: Add connection and response timeouts. Implement retry with exponential backoff and a dead-letter mechanism.

## M6 — Audit Logging

- **Severity**: Medium
- **Description**: No audit log exists for sensitive operations (API key creation/rotation, integration install/uninstall, OAuth connections, admin actions).
- **Recommendation**: Add an audit log table and record critical actions with actor, timestamp, and action details.

## L1 — Content Security Policy Headers

- **Severity**: Low
- **Description**: The application does not set Content-Security-Policy headers, which could allow XSS if an injection point is found.
- **Recommendation**: Configure CSP headers in `next.config.js` or middleware. Start with a report-only policy and tighten over time.

## L2 — Subresource Integrity (SRI)

- **Severity**: Low
- **Description**: External scripts/stylesheets (if any) are not loaded with SRI hashes.
- **Recommendation**: Add integrity attributes to any externally loaded resources.

## L3 — Dependency Vulnerability Scanning

- **Severity**: Low
- **Description**: No automated dependency vulnerability scanning is configured in CI/CD.
- **Recommendation**: Add `npm audit` or a tool like Snyk/Socket to the CI pipeline.
