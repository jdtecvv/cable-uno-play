import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cableuno.play',
  appName: 'Cable Uno Play',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // For development, allow clear text traffic
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
