import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'py.titanus.app',
  appName: 'TITANUS',
  webDir: 'dist',
  android: { backgroundColor: '#14120E' },
  plugins: {
    LocalNotifications: { iconColor: '#C9A66B' },
  },
};

export default config;
