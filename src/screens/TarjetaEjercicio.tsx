import type { ReactNode } from 'react';
import { buscarEjercicio } from '../lib/biblioteca';
import { aKg, aUnidad, redondear } from '../lib/logica';
import type { Ejercicio, TipoSerie, Unidad } from '../lib/tipos';
import { Icono } from '../ui/Icono';
import { Miniatura } from './Miniatura';

/**
 * Editor ÚNICO de un ejercicio: una fila por serie (tipo · peso · reps · papelera), "Agregar serie"
 * y las acciones (descanso, subir, bajar, quitar). Se usa igual al editar una rutina, al armar el
 * entrenamiento libre, al preparar una rutina la primera vez y cuando el entrenador arma la de su cliente.
 */
export interface FilaSerie { peso: number; reps: number; tipo?: TipoSerie }

const SIGUIENTE: Record<TipoSerie, TipoSerie> = { normal: 'calentamiento', calentamiento: 'fallo', fallo: 'normal', drop: 'normal' };
const LETRA: Partial<Record<TipoSerie, string>> = { calentamiento: 'C', fallo: 'F', drop: 'D' };
const NOMBRE: Record<TipoSerie, string> = { normal: 'normal', calentamiento: 'calentamiento', fallo: 'al fallo', drop: 'drop set' };

export function textoDescanso(s: number) {
  if (!s) return 'Apagado';
  const m = Math.floor(s / 60), r = s % 60;
  return m ? `${m} min${r ? ` ${r} s` : ''}` : `${r} s`;
}

/** Acciones a la vista: descanso, subir, bajar y quitar el ejercicio */
export function AccionesEjercicio({ i, total, nombre, descanso, alDescanso, alMover, alEliminar }: {
  i: number; total: number; nombre: string; descanso?: string;
  alDescanso?: () => void; alMover: (d: -1 | 1) => void; alEliminar: () => void;
}) {
  const b = 'flex h-8 w-8 items-center justify-center rounded-[8px] border border-ln2 text-mu hover:border-gold disabled:opacity-30';
  return (
    <div className="mt-2 flex items-center gap-1.5">
      {descanso !== undefined ? (
        <button className="mr-auto flex min-w-0 items-center gap-1 truncate text-[13.5px] font-semibold oro" onClick={alDescanso}>
          <Icono n="reloj" size={16} />Descanso: {descanso}
        </button>
      ) : <span className="mr-auto" />}
      <button className={b} aria-label={`Subir ${nombre}`} title="Subir" disabled={i === 0} onClick={() => alMover(-1)}><Icono n="arriba" size={16} /></button>
      <button className={b} aria-label={`Bajar ${nombre}`} title="Bajar" disabled={i === total - 1} onClick={() => alMover(1)}><Icono n="abajo" size={16} /></button>
      <button className={`${b} hover:text-miss`} aria-label={`Quitar ${nombre}`} title="Quitar ejercicio" onClick={alEliminar}><Icono n="basura" size={16} /></button>
    </div>
  );
}

/** Tabla de series: tocando el número cambia el tipo (normal → calentamiento → al fallo) */
export function TablaSeries<T extends FilaSerie>({ series, unidad, nombre, alCambiar, nueva }: {
  series: T[];
  unidad: Unidad;
  nombre: string;
  alCambiar: (s: T[]) => void;
  /** Cómo es una serie nueva a partir de la última */
  nueva: (ultima: T | undefined) => T;
}) {
  const campo = 'h-10 w-full min-w-0 rounded-[8px] border border-ln2 bg-transparent text-center num text-[16px] outline-none focus:border-gold';
  const poner = (j: number, cambio: Partial<FilaSerie>) => alCambiar(series.map((s, k) => (k === j ? { ...s, ...cambio } : s)));
  let normales = 0;
  return (
    <div>
      <div className="mt-3 grid grid-cols-[38px_minmax(0,1fr)_minmax(0,1fr)_32px] gap-2 text-[11px] font-bold uppercase tracking-[.08em] text-mu2">
        <span className="text-center">Serie</span><span className="text-center">{unidad}</span><span className="text-center">Reps</span><span />
      </div>
      {series.map((s, j) => {
        const tipo = s.tipo ?? 'normal';
        if (tipo === 'normal') normales++;
        const color = tipo === 'fallo' ? 'text-miss' : tipo === 'calentamiento' ? 'text-mu' : 'oro';
        return (
          <div key={j} data-testid="serie-armado" className="mt-1.5 grid grid-cols-[38px_minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-2">
            <button aria-label={`Tipo de la serie ${j + 1} de ${nombre}: ${NOMBRE[tipo]}`} title="Tocá para cambiar: normal, calentamiento o al fallo"
              className={`num flex h-10 items-center justify-center rounded-[8px] border border-transparent text-[15px] font-bold hover:border-ln2 ${color}`}
              onClick={() => poner(j, { tipo: SIGUIENTE[tipo] })}>
              {LETRA[tipo] ?? normales}
            </button>
            <input aria-label={`Peso serie ${j + 1} de ${nombre}`} type="number" inputMode="decimal" step="0.5" min={0} placeholder="0" className={campo}
              value={s.peso ? redondear(aUnidad(s.peso, unidad)) : ''}
              onChange={(ev) => poner(j, { peso: aKg(Math.max(0, Number(ev.target.value) || 0), unidad) })} />
            <input aria-label={`Repeticiones serie ${j + 1} de ${nombre}`} type="number" inputMode="numeric" min={0} className={campo}
              value={s.reps || ''} placeholder={tipo === 'fallo' ? 'máx' : '0'}
              onChange={(ev) => poner(j, { reps: Math.max(0, Math.round(Number(ev.target.value) || 0)) })} />
            <button aria-label={`Eliminar serie ${j + 1} de ${nombre}`} title="Eliminar serie" disabled={series.length <= 1}
              onClick={() => alCambiar(series.filter((_, k) => k !== j))}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-mu2 hover:text-miss disabled:opacity-30">
              <Icono n="basura" size={16} />
            </button>
          </div>
        );
      })}
      <button className="btn-sec mt-2 h-9 w-full text-[13.5px]" aria-label={`Más series de ${nombre}`} disabled={series.length >= 12}
        onClick={() => {
          // La serie nueva copia la última normal (no la de fallo)
          const base = [...series].reverse().find((s) => (s.tipo ?? 'normal') === 'normal') ?? series[series.length - 1];
          const n = nueva(base);
          const iFallo = series.findIndex((s) => s.tipo === 'fallo');
          alCambiar(iFallo >= 0 ? [...series.slice(0, iFallo), n, ...series.slice(iFallo)] : [...series, n]);
        }}>
        <Icono n="mas" size={16} />Agregar serie
      </button>
    </div>
  );
}

/** Tarjeta completa de un ejercicio, igual en todas las pantallas donde se arma */
export function TarjetaEjercicio<T extends FilaSerie>({
  i, total, ejercicioId, propios, subtitulo, series, unidad, descanso, alSeries, nueva, alDescanso, alMover, alEliminar, extra,
}: {
  i: number; total: number; ejercicioId: string; propios: Ejercicio[]; subtitulo?: string;
  series: T[]; unidad: Unidad; descanso: string;
  alSeries: (s: T[]) => void; nueva: (ultima: T | undefined) => T;
  alDescanso: () => void; alMover: (d: -1 | 1) => void; alEliminar: () => void;
  /** Algo propio de la pantalla (por ejemplo la nota de la rutina) */
  extra?: ReactNode;
}) {
  const ej = buscarEjercicio(ejercicioId, propios);
  const nombre = ej?.nombre ?? 'Ejercicio';
  return (
    <li className="tarjeta px-3" data-testid="ejercicio-armado">
      <div className="flex items-center gap-3">
        <span className="num w-5 shrink-0 text-center text-mu">{i + 1}</span>
        <Miniatura musculo={ej?.musculo} id={ejercicioId} tam={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold oro">{nombre}</span>
          <span className="block truncate text-[12.5px] text-mu">{subtitulo ?? ej?.musculo}</span>
        </span>
      </div>
      <TablaSeries series={series} unidad={unidad} nombre={nombre} alCambiar={alSeries} nueva={nueva} />
      {extra}
      <AccionesEjercicio i={i} total={total} nombre={nombre} descanso={descanso} alDescanso={alDescanso} alMover={alMover} alEliminar={alEliminar} />
    </li>
  );
}
