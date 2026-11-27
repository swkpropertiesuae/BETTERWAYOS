# Betterway Mortgages OS v3 — Native Android & iOS Mobile App

Official Capacitor 7 native mobile wrapper for **Betterway Mortgages LLC** (`com.betterwaymortgages.os`).

## Native Capabilities Included
- **Live Cloud OS Sync:** Connects directly to `https://betterwayos.vercel.app/os` with zero app-store delay on rate or workflow updates.
- **Native GPS Location (`@capacitor/geolocation`):** High-accuracy GPS pinning for Mortgage Field Meetings (Client Consultation, Bank RM & FOL Signing, Valuation Inspection, Developer SOA & NOC, DLD Trustee Transfer) + Oud Metha QR check-in.
- **Native Camera & Photo Upload (`@capacitor/camera`):** Direct evidence capture for valuation reports, FOL signing proofs & KYC uploads.
- **Native Share & Haptics (`@capacitor/share`, `@capacitor/haptics`):** Share 3-Bank proposals, WhatsApp quotes & Word/JPEG/Excel files directly from iPhone or Android.
- **Obsidian & Pearl Branding:** Glossy black `#070A0F` status bar, splash screen & official 4K Betterway transparent app icon.

## Build Android APK / AAB Locally
```bash
cd mobile
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# Signed Google Play Bundle: ./gradlew bundleRelease
```

## Build iOS App (Xcode on macOS)
```bash
cd mobile
npm install
npx cap sync ios
npx cap open ios
# Select Team signing in Xcode -> Product -> Archive -> Distribute to TestFlight / App Store
```

## Automated Cloud Builds (GitHub Actions)
Trigger **Betterway OS Mobile Builds (Android APK & iOS)** from the GitHub Actions tab to compile fresh Android `.apk` and iOS simulator artifacts in the cloud automatically.
