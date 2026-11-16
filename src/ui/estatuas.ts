import avatarH from '../assets/avatar.webp';
import avatarM from '../assets/avatar-f.webp';
import capaH from '../assets/capa.webp';
import capaM from '../assets/capa-f.webp';
import espaldaH from '../assets/espalda.webp';
import espaldaM from '../assets/espalda-f.webp';
import legionarioH from '../assets/legionario.webp';
import legionarioM from '../assets/legionario-f.webp';
import type { Figura } from '../lib/tipos';

/** Estatuas del diseño del dueño, en versión legionario o legionaria (Perfil → Apariencia) */
const ESTATUAS = {
  hombre: { avatar: avatarH, capa: capaH, espalda: espaldaH, legionario: legionarioH },
  mujer: { avatar: avatarM, capa: capaM, espalda: espaldaM, legionario: legionarioM },
};

export function estatuas(figura: Figura | undefined) {
  return ESTATUAS[figura === 'mujer' ? 'mujer' : 'hombre'];
}

/**
 * Dónde está la cabeza en cada imagen (posición vertical para object-position).
 * Así, cuando el recuadro es ancho y bajo (PC), el recorte deja ver la cabeza en vez del torso.
 */
const FOCO = {
  hombre: { capa: '50% 8%', espalda: '50% 8%', legionario: '50% 26%' },
  mujer: { capa: '50% 6%', espalda: '50% 6%', legionario: '50% 4%' },
};
export function foco(figura: Figura | undefined, cual: 'capa' | 'espalda' | 'legionario'): string {
  return FOCO[figura === 'mujer' ? 'mujer' : 'hombre'][cual];
}
