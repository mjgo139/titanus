import { useNavigate } from 'react-router-dom';
import { guardarBorrador, leerBorrador, type Borrador } from '../lib/borrador';
import { iniciarDesdeRutina, iniciarLibre, iniciarRepeticion } from '../lib/entreno';
import { SOBRECARGA_POR_DEFECTO } from '../lib/sobrecarga';
import type { Entrenamiento, Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';

/** Empezar un entrenamiento (libre, desde rutina o repitiendo uno anterior) */
export function useEmpezar() {
  const { repo, usuario, perfil, aviso } = useSesion();
  const nav = useNavigate();

  function abrir(b: Borrador) {
    if (leerBorrador(usuario.uid)) {
      aviso('Ya tenés un entrenamiento en curso');
      nav('/entrenar');
      return;
    }
    guardarBorrador(usuario.uid, b);
    nav('/entrenar');
  }

  return {
    libre: () => abrir(iniciarLibre()),
    rutina: async (r: Rutina) => {
      const est = await repo.leerEstados(usuario.uid, r.ejercicios.map((e) => e.ejercicioId));
      abrir(iniciarDesdeRutina(r, est, Date.now(), perfil.sobrecarga ?? SOBRECARGA_POR_DEFECTO));
    },
    repetir: (e: Entrenamiento) => abrir(iniciarRepeticion(e)),
  };
}
