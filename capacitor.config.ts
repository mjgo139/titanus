import type { CapacitorConfig } from '@capacitor/cli';

// La APK abre siempre la versión publicada en la web, así se actualiza sola en cada publicación.
// Si no hay conexión la primera vez, muestra public/sin-conexion.html (va dentro de la APK).
const config: CapacitorConfig = {
  appId: 'py.titanus.app',
  appName: 'TITANUS',
  webDir: 'dist',
  server: {
    url: 'https://titanus-10398.web.app',
    errorPath: 'sin-conexion.html',
  },
  android: { backgroundColor: '#14120E' },
  plugins: {
    LocalNotifications: { iconColor: '#C9A66B' },
  },
};

export default config;
