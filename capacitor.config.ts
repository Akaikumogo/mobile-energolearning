import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.elektroxavfsizlik.app',
  appName: 'ElektroLearn',
  webDir: 'dist',
  bundledWebRuntime: false,
  /** Android 15+ (API 35): edge-to-edge; WebView gets system bar / cutout margins. */
  android: {
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    LiveUpdates: {
      appId: 'c5c3bff6', // Buni keyingi bosqichda Appflow'dan olamiz
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    }
  }
};

export default config;
