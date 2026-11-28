import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betterwaymortgages.os',
  appName: 'Betterway Mortgages OS',
  webDir: 'www',
  server: {
    url: 'https://betterwayos.vercel.app/os',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'betterwayos.vercel.app',
      'betterwaymortgages.com',
      '*.betterwaymortgages.com',
      '*.supabase.co',
      'maps.google.com',
      'wa.me',
    ],
  },
  android: {
    backgroundColor: '#0b192c',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#0b192c',
    contentInset: 'automatic',
    scheme: 'BetterwayOS',
    allowsLinkPreview: false,
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1100,
      launchAutoHide: true,
      backgroundColor: '#0b192c',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b192c',
      overlaysWebView: false,
    },
  },
};

export default config;
