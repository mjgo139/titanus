import type { Borrador } from '../lib/borrador';
import { buscarEjercicio } from '../lib/biblioteca';
import { romano } from '../lib/logica';
import type { Ejercicio } from '../lib/tipos';
import { Icono } from '../ui/Icono';

/** Índice numerado del entrenamiento (PC): deja claro qué ejercicio sigue a cuál */
export function OrdenEntreno({ b, propios, actual, alElegir, className = '' }: {
  b: Borrador; propios: Ejercicio[]; actual: number; alElegir: (i: number) => void; className?: string;
}) {
  return (
    <nav aria-label="Orden de hoy" className={`tarjeta px-3 py-3 ${className}`} data-testid="orden-entreno">
      <div className="etiqueta px-1">Orden de hoy</div>
      <ol className="mt-2 flex flex-col">
        {b.ejercicios.map((e, i) => {
          const hechas = e.series.filter((s) => s.hecha).length;
          const listo = e.series.length > 0 && hechas === e.series.length;
          const esActual = i === actual;
          return (
            <li key={e.ejercicioId + i} className="relative">
              {/* Hilo que une un ejercicio con el siguiente */}
              {i < b.ejercicios.length - 1 && <span className="absolute left-[22px] top-[38px] h-[calc(100%-30px)] w-px bg-ln2" aria-hidden />}
              <button onClick={() => alElegir(i)} aria-current={esActual ? 'step' : undefined}
                className={`relative flex w-full items-center gap-3 rounded-[12px] px-1.5 py-2 text-left transition-colors hover:bg-sf2 ${esActual ? 'bg-sf2' : ''}`}>
                <span className={`num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13.5px] ${listo ? '' : esActual ? 'border-gold oro' : 'border-ln3 text-mu'}`}
                  style={listo ? { background: 'var(--verde)', borderColor: 'var(--verde)', color: 'var(--sobre-verde)' } : undefined}>
                  {listo ? <Icono n="check" size={16} /> : romano(i + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13.5px] font-semibold ${esActual ? 'oro' : listo ? 'text-mu' : ''}`}>
                    {buscarEjercicio(e.ejercicioId, propios)?.nombre ?? 'Ejercicio'}
                  </span>
                  <span className="block text-[12.5px] text-mu">{hechas} de {e.series.length} series{esActual ? ' · ahora' : ''}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
