import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betterwaymortgages.os',
  appName: 'Betterway Mortgages OS',
  webDir: 'www',
  server: {
    url: 'https://betterwayos.vercel.app/os',
    cleartext: false,
    allowNavigation: ['betterwayos.vercel.app', 'betterwaymortgages.com', '*.betterwaymortgages.com', 'maps.google.com'],
  },
  android: {
    backgroundColor: '#070A0F',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#070A0F',
    contentInset: 'automatic',
    scheme: 'BetterwayOS',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#070A0F',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#070A0F',
    },
  },
};

export default config;
