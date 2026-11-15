import { imagenesEjercicio } from '../lib/biblioteca';
import type { Musculo } from '../lib/tipos';

const SIGLA: Record<Musculo, string> = {
  Pecho: 'PE', Espalda: 'ES', Hombros: 'HO', Bíceps: 'BI', Tríceps: 'TR', Piernas: 'PI', Glúteos: 'GL', Abdomen: 'AB', Cardio: 'CA',
};

/**
 * Animación del ejercicio: alterna la foto de inicio y la de final del movimiento
 * (fotos de free-exercise-db, dominio público). Sin fotos, muestra la sigla del músculo.
 */
export function Animacion({ id, nombre, className = '', completa = false }: { id: string; nombre?: string; className?: string; completa?: boolean }) {
  const ajuste = completa ? 'object-contain' : 'object-cover';
  const img = imagenesEjercicio(id);
  if (!img) return null;
  return (
    <div className={`relative overflow-hidden ${className}`} role="img" aria-label={nombre ? `Cómo se hace: ${nombre}` : 'Cómo se hace'}>
      <img src={img[0]} alt="" loading="lazy" className={`absolute inset-0 h-full w-full ${ajuste}`} />
      <img src={img[1]} alt="" loading="lazy" className={`animar-movimiento absolute inset-0 h-full w-full ${ajuste}`} />
    </div>
  );
}

/** Medallón del ejercicio: foto animada si hay, si no la sigla del músculo en letra romana */
export function Miniatura({ musculo, id, tam = 44 }: { musculo?: Musculo; id?: string; tam?: number }) {
  if (id && imagenesEjercicio(id)) {
    return (
      <span aria-hidden className="block shrink-0 overflow-hidden rounded-full border border-gold2" style={{ width: tam, height: tam }}>
        <Animacion id={id} className="h-full w-full" />
      </span>
    );
  }
  return (
    <span aria-hidden className="marca flex shrink-0 items-center justify-center rounded-full border border-gold2 oro"
      style={{ width: tam, height: tam, fontSize: tam * 0.32, background: 'radial-gradient(circle at 30% 30%, var(--goldbg), var(--sf))' }}>
      {musculo ? SIGLA[musculo] : '·'}
    </span>
  );
}
