import type { Comentario, Objetivo, Profesional, Solicitud, Vinculo, Codigo } from '../pro/tipos';
import type { EstadoEjercicio, Perfil, Rutina, Entrenamiento, RegistroCuerpo } from '../lib/tipos';
import type { Usuario } from './repo';
import { USUARIO_PRUEBA } from './semilla';
import { idVinculo } from '../pro/logica';

const DIA = 86_400_000;

interface DatosUsuario {
  perfil?: Perfil;
  rutinas: Map<string, Rutina>;
  estados: Map<string, EstadoEjercicio>;
  historial: Entrenamiento[];
  cuerpo: Map<string, RegistroCuerpo>;
  comentarios: Map<string, Comentario>;
  objetivos: Map<string, Objetivo>;
}

/**
 * Modo prueba: Marco (la cuenta de ejemplo) también es entrenador, con tres clientes inventados.
 *  - Ana Ruiz: al día, con rutina asignada, comentarios y objetivos. Entra con ana@ejemplo.com / titanus.
 *  - Bruno Paz: hace 9 días que no entrena (alerta).
 *  - Carla Gómez: recién se sumó, sin registros.
 * Además hay una solicitud pendiente de Diego Ferreira para que el admin la apruebe.
 */
export function cargarEquipoDePrueba(ahora: number, h: {
  cuenta: (u: Usuario) => void;
  ejemplo: (u: Usuario, nombre: string, desfaseDias?: number) => void;
  datos: (uid: string) => DatosUsuario;
  comun: { profesionales: Map<string, Profesional>; solicitudes: Map<string, Solicitud>; codigos: Map<string, Codigo>; vinculos: Map<string, Vinculo> };
}) {
  const marco: Profesional = { uid: USUARIO_PRUEBA.uid, tipo: 'entrenador', nombre: 'Marco', codigo: 'TIT-M4RC', activo: true, alta: ahora - 70 * DIA };
  h.comun.profesionales.set(marco.uid, marco);
  h.comun.codigos.set(marco.codigo, { codigo: marco.codigo, profesionalId: marco.uid, tipo: 'entrenador', nombre: marco.nombre });
  h.comun.solicitudes.set('u-diego', {
    uid: 'u-diego', tipo: 'entrenador', nombre: 'Diego Ferreira', email: 'diego@ejemplo.com',
    mensaje: 'Soy personal trainer en un gimnasio de barrio, tengo 15 alumnos.', fecha: ahora - 2 * DIA, estado: 'pendiente',
  });

  const clientes: { u: Usuario; nombre: string; desfase?: number; hace: number }[] = [
    // Ana siempre "al día": se corre su calendario para que haya entrenado hace 1 o 2 días, sea el día que sea
    { u: { uid: 'c-ana', email: 'ana@ejemplo.com', nombre: 'Ana Ruiz' }, nombre: 'Ana Ruiz', desfase: desfaseAlDia(ahora), hace: 40 },
    { u: { uid: 'c-bruno', email: 'bruno@ejemplo.com', nombre: 'Bruno Paz' }, nombre: 'Bruno Paz', desfase: 9, hace: 55 },
    { u: { uid: 'c-carla', email: 'carla@ejemplo.com', nombre: 'Carla Gómez' }, nombre: 'Carla Gómez', hace: 2 },
  ];
  for (const c of clientes) {
    h.cuenta(c.u);
    if (c.desfase !== undefined) h.ejemplo(c.u, c.nombre, c.desfase);
    else {
      const d = h.datos(c.u.uid);
      d.perfil = {
        uid: c.u.uid, nombre: c.nombre, email: c.u.email, tema: 'oscuro', unidad: 'kg',
        recordatorio: { activo: false, hora: '18:30', dias: [1, 3, 5] }, creado: ahora - c.hace * DIA, resumen: { dias: [], total: 0 }, conocido: true,
      };
    }
    const v: Vinculo = {
      id: idVinculo(marco.uid, c.u.uid), profesionalId: marco.uid, clienteId: c.u.uid, tipo: 'entrenador',
      nombreProfesional: marco.nombre, nombreCliente: c.nombre, codigo: marco.codigo, desde: ahora - c.hace * DIA, activo: true,
    };
    h.comun.vinculos.set(v.id, v);
  }

  // Ana y Carla ven las estatuas de legionaria
  for (const uid of ['c-ana', 'c-carla']) { const p = h.datos(uid).perfil; if (p) p.figura = 'mujer'; }

  // Ana: una rutina extra asignada por Marco, comentarios y objetivos
  const ana = h.datos('c-ana');
  ana.rutinas.set('r-marco-core', {
    id: 'r-marco-core', nombre: 'Core y movilidad', dias: [6], orden: 3, creado: ahora - 10 * DIA,
    asignadaPor: marco.uid, nombreAsignador: marco.nombre,
    ejercicios: [
      { ejercicioId: 'plancha', series: 3, reps: 40, descanso: 45, nota: 'segundos' },
      { ejercicioId: 'crunch', series: 3, reps: 15, descanso: 45 },
      { ejercicioId: 'hip-thrust', series: 3, reps: 12, descanso: 75 },
    ],
  });
  for (const r of ana.rutinas.values()) if (r.id !== 'r-marco-core') { r.asignadaPor = marco.uid; r.nombreAsignador = marco.nombre; }
  const ult = ana.historial[0];
  const ant = ana.historial[1];
  const coment: Comentario[] = [
    ult && { id: 'k1', autorId: marco.uid, autorNombre: 'Marco', sobre: { tipo: 'entrenamiento', id: ult.id, titulo: ult.nombre }, texto: 'Muy bien la sentadilla. La próxima subí 2,5 kg y cuidá que la espalda no se redondee.', fecha: ahora - 10 * 3600_000, leido: false },
    ant && { id: 'k2', autorId: marco.uid, autorNombre: 'Marco', sobre: { tipo: 'entrenamiento', id: ant.id, titulo: ant.nombre }, texto: 'Buen volumen. Descansá bien el fin de semana.', fecha: ahora - 3 * DIA, leido: true },
    ant && { id: 'k3', autorId: 'c-ana', autorNombre: 'Ana Ruiz', sobre: { tipo: 'entrenamiento', id: ant.id, titulo: ant.nombre }, texto: '¡Gracias! Me costó el peso muerto.', fecha: ahora - 3 * DIA + 3600_000, leido: true },
  ].filter(Boolean) as Comentario[];
  for (const c of coment) ana.comentarios.set(c.id, c);
  const pesoAna = [...ana.cuerpo.values()].sort((a, b) => a.fecha - b.fecha)[0]?.peso ?? 78;
  const objetivos: Objetivo[] = [
    { id: 'o1', tipo: 'frecuencia', titulo: 'Entrenar 3 veces por semana', meta: 3, unidad: 'veces', creadoPor: marco.uid, fecha: ahora - 30 * DIA },
    { id: 'o2', tipo: 'marca', titulo: 'Sentadilla 90 kg', meta: 90, unidad: 'kg', referencia: 'sentadilla', creadoPor: marco.uid, fecha: ahora - 30 * DIA },
    { id: 'o3', tipo: 'corporal', titulo: 'Bajar a 74 kg', meta: 74, unidad: 'kg', referencia: 'peso', bajar: true, inicio: pesoAna, creadoPor: marco.uid, fecha: ahora - 30 * DIA },
  ];
  for (const o of objetivos) ana.objetivos.set(o.id, o);

  // Bruno: un comentario sin responder
  h.datos('c-bruno').comentarios.set('k4', {
    id: 'k4', autorId: marco.uid, autorNombre: 'Marco', texto: '¿Todo bien? Hace unos días que no te veo entrenar.', fecha: ahora - 2 * DIA, leido: false,
  });
}

/** Días a correr el calendario de ejemplo (entrena lun/mié/vie) para que el último entrenamiento sea de hace 1–2 días */
function desfaseAlDia(ahora: number): number {
  for (let k = 1; k <= 3; k++) if ([1, 3, 5].includes(new Date(ahora - k * DIA).getDay())) return k - 1;
  return 0;
}
