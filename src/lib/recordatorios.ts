import { Capacitor } from '@capacitor/core';
import type { Recordatorio } from './tipos';

export const esNativo = () => Capacitor.isNativePlatform();

/**
 * Recordatorios locales: el propio teléfono avisa, sin servidor (plan gratis).
 * En la APK se programan con avisos nativos. En la web solo se guardan las preferencias.
 */
export async function programarRecordatorios(r: Recordatorio): Promise<'programado' | 'sin-permiso' | 'solo-web'> {
  if (!esNativo()) return 'solo-web';
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const pend = await LocalNotifications.getPending();
  if (pend.notifications.length) await LocalNotifications.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
  if (!r.activo || !r.dias.length) return 'programado';
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return 'sin-permiso';
  const [h, m] = r.hora.split(':').map(Number);
  await LocalNotifications.schedule({
    notifications: r.dias.map((d) => ({
      id: 100 + d,
      title: 'TITANUS',
      body: 'Hoy toca entrenar. Una serie por vez.',
      // Capacitor usa 1 = domingo … 7 = sábado
      schedule: { on: { weekday: d + 1, hour: h, minute: m }, allowWhileIdle: true },
    })),
  });
  return 'programado';
}
