# Security Policy — Betterway Mortgages OS

## Governance Hierarchy
- **Supreme Owner:** Shabib Siraj (`shabib@betterwaymortgages.com`) — exclusive authority to supervise/suspend `admin@betterwaymortgages.com`, approve Pending Delete Bin purges, authorize Deal Withdrawal refunds, and sign off Manager Administrative Decisions.
- **Executive Director:** Warda (`warda@betterwaymortgages.com`) — executive governance and reception QR authority.
- **System Administrator:** Betterway Admin (`admin@betterwaymortgages.com`) — operational administration under Owner supervision.
- **Team Manager:** Daniel Xavier (`daniel@betterwaymortgages.com`) — advisory leadership, rate approval checker, and Reception QR stand management.

## Cryptographic & Authentication Controls
1. **Password Storage:** `scrypt` per-user salted hashes (`16`-byte random salt, `64`-byte derived key) verified with `crypto.timingSafeEqual`. Zero hardcoded backdoor passwords.
2. **Brute-Force Lockout:** 5 consecutive failed sign-in attempts lock the account for 15 minutes (`HTTP 423 Locked`), logged in the `login_events` table.
3. **Multi-Factor Authentication (TOTP MFA):** RFC 6238 TOTP supported per user via `/os/security`. Recommended mandatory for all `SUPER_ADMIN`, `FINANCE_ADMIN`, `COMPLIANCE_MLRO`, and `HR_MANAGER` accounts.
4. **Session Cookies:** `bw_os_session` is `HttpOnly`, `SameSite=Lax`, and `Secure` in production. Sign-out is `POST`-only (`/api/v1/auth/logout`) to block cross-site logout CSRF.
5. **Document Vault:** AES-256-GCM authenticated encryption with per-file 96-bit IV, SHA-256 integrity hash, and path-traversal protection (`src/server/vault/crypto.ts`).
6. **Public Website Webhook Intake:** `/api/v1/intake/leads` enforces mandatory `X-Betterway-Signature` (`sha256=` HMAC) whenever `BW_INTAKE_HMAC_SECRET` is configured, strict `BW_PUBLIC_SITE_ORIGIN` CORS, and per-IP rate limiting.
7. **Reception Attendance Anti-Loophole Gate:** Camera-scannable ISO/IEC 18004 QR stand paired with cellular-data blocking, device fingerprinting (`staff_devices`), and Owner/Manager-controlled **Office Wi-Fi Public IP Lock** (`office_ip_locked`).
8. **Append-Only Audit Trail:** SQLite triggers (`trg_audit_logs_no_update`, `trg_audit_logs_no_delete`) prevent modification or deletion of `audit_logs`.

## Production Deployment Checklist
- Provision `BW_SESSION_SECRET`, `BW_VAULT_MASTER_KEY`, and `BW_INTAKE_HMAC_SECRET` (32-byte hex keys).
- Set unique `OWNER_PASSWORD`, `ADMIN_PASSWORD`, and `STAFF_DEFAULT_PASSWORD` before first boot.
- Mount a persistent volume at `BW_OS_DATA_DIR` (e.g. `/var/lib/betterway-os`) for SQLite + encrypted vault persistence.
- Enable TOTP MFA on Owner, Executive Director, Admin, MLRO, Finance, and HR accounts via `/os/security`.
- Lock the Office Wi-Fi public IP from the office network via `/os/reception-qr`.
