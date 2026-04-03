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
};

export default config;

