# Oud Metha Hikvision Door Fingerprint LAN Relay

Connects Betterway Mortgages LLC's **Al Nasr Plaza, Oud Metha** Hikvision biometric door terminal to Betterway OS on Vercel (`POST /api/v1/attendance/hikvision`).

## Setup (5 Minutes on Office Reception PC)
1. Ensure every Betterway employee's Hikvision `Employee No` matches their OS Employee Code (`BW-001` Warda, `BW-002` Shabib, `BW-003` Daniel, `BW-004` Elton, `BW-005` Rahaba, `BW-006` Nusrik, `BW-007` Asif, `BW-008` Reshma).
2. Enable ISAPI HTTP/JSON on the Hikvision terminal (`Configuration → Network → Advanced Settings → Integration Protocol`).
3. Set environment variables and run:
   ```powershell
   $env:HIKVISION_HOST="http://192.168.1.64"
   $env:HIKVISION_USER="admin"
   $env:HIKVISION_PASS="<device-password>"
   $env:BW_OS_HIKVISION_URL="https://betterwayos.vercel.app/api/v1/attendance/hikvision"
   $env:BW_HIKVISION_HMAC_SECRET="<matching-vercel-secret>"
   node tools/hikvision-relay/index.mjs
   ```
4. Every morning fingerprint door unlock logs `CHECK_IN` in Supabase and automatically posts a live Check-In card into `#attendance-checkin` in **Team Group (Inside)**. Mid-day door returns log cleanly as `DOOR_REENTRY` without triggering false check-outs.
