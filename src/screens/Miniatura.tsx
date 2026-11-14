import type { Musculo } from '../lib/tipos';

const SIGLA: Record<Musculo, string> = {
  Pecho: 'PE', Espalda: 'ES', Hombros: 'HO', Bíceps: 'BI', Tríceps: 'TR', Piernas: 'PI', Glúteos: 'GL', Abdomen: 'AB', Cardio: 'CA',
};

/** Medallón del ejercicio con la sigla del músculo, en letra romana */
export function Miniatura({ musculo, tam = 44 }: { musculo?: Musculo; tam?: number }) {
  return (
    <span aria-hidden className="marca flex shrink-0 items-center justify-center rounded-full border border-gold2 oro"
      style={{ width: tam, height: tam, fontSize: tam * 0.32, background: 'radial-gradient(circle at 30% 30%, var(--goldbg), var(--sf))' }}>
      {musculo ? SIGLA[musculo] : '·'}
    </span>
  );
}
