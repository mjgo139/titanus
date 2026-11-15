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
