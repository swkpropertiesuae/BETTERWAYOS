# Betterway Mortgages OS v3.2 — Native Android & iOS Mobile App

Official Capacitor 7 native mobile wrapper for **Betterway Mortgages LLC** (`com.betterwaymortgages.os`).

## Native Capabilities Included (v3.2.0)
- **Live Cloud OS Sync:** Connects directly to `https://betterwayos.vercel.app/os` with zero app-store delay on 18-bank rate, matrix, or workflow updates.
- **Betterway SIP Cloud Calls (WebRTC Audio):** Native Android `RECORD_AUDIO` / `MODIFY_AUDIO_SETTINGS` + WebView origin permission grant in `MainActivity.java` and iOS `NSMicrophoneUsageDescription` + background audio mode.
- **Universal Form & Task Attachments:** Native Android file/media permissions + iOS `UIFileSharingEnabled` & `LSSupportsOpeningDocumentsInPlace` for attaching PDFs, images, Excel, and Word documents to tasks, follow-ups, leads, cases, and forms.
- **Native GPS & Oud Metha QR (`@capacitor/geolocation`, `@capacitor/camera`):** High-accuracy GPS pinning for Mortgage Field Meetings + 20-second Oud Metha reception QR check-in.
- **Sovereign Private-Banking Corporate Branding:** Oxford Midnight Navy (`#0b192c`), British Pine-Emerald (`#0e5a49`), Champagne Brass (`#c49a45`), and shining-black house launcher icons across all Android mipmaps & iOS AppIcon sizes.

## Automated Cloud Builds & Direct Downloads (GitHub Actions + Releases)
Every push to `mobile/**` automatically builds and publishes:
- `Betterway-Mortgages-OS-Android-v3.2.0.apk` (Direct Android install)
- `Betterway-Mortgages-OS-Android-v3.2.0.aab` (Google Play Store bundle)
- `Betterway-Mortgages-OS-iOS-v3.2.0.ipa` (iOS device package for Xcode / TestFlight / AltStore)
- `Betterway-Mortgages-OS-iOS-Simulator-v3.2.0.app.zip` (macOS iOS Simulator build)

Download directly from: `https://github.com/swkpropertiesuae/BETTERWAYOS/releases/tag/mobile-latest`

## Build Locally
```bash
# Android APK & AAB
cd mobile
npm install
npx cap sync android
cd android && ./gradlew assembleRelease bundleRelease

# iOS (macOS + Xcode)
cd mobile
npm install
npx cap sync ios
npx cap open ios
```
