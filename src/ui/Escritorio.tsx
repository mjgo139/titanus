/**
 * Widget para Windows (v1.33.0): fila y hoja en Perfil, y el hook que mantiene el resumen al día.
 * No aparece en la APK (es para la PC).
 */
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { armarTextoEscritorio, bajarArchivo, horaCorta, nuevoCodigoEscritorio, paqueteEscritorio, subirResumenEscritorio } from '../../familia/escritorio';
import { firebaseConfig } from '../firebaseConfig';
import { APP_ESCRITORIO, CLAVE_ESCRITORIO, resumenStoaGym } from '../lib/escritorio';
import type { Perfil, Rutina } from '../lib/tipos';
import type { Repo } from '../data/repo';
import { useApp, useSesion } from './contexto';
import { Icono } from './Icono';
import { Hoja } from './piezas';

const APP = APP_ESCRITORIO((firebaseConfig as { projectId?: string }).projectId || 'titanus-10398');
const ARCHIVO = 'StoaGym.rmskin';

async function subir(repo: Repo, uid: string, perfil: Perfil, codigo: string, rutinas: Rutina[] | null, forzar = false) {
  const lista = rutinas ?? await repo.leerRutinas(uid);
  const texto = armarTextoEscritorio(resumenStoaGym(perfil, lista), horaCorta());
  await subirResumenEscritorio(CLAVE_ESCRITORIO, codigo, texto, (c, t) => repo.guardarEscritorio(uid, c, t), forzar);
}

/** Mientras la app está abierta: si cambió algo, sube el resumen (3 s después, para no gastar escrituras). */
export function useResumenEscritorio() {
  const { repo, usuario, perfil } = useApp();
  const codigo = perfil?.escritorio ?? null;
  useEffect(() => {
    if (!codigo || !usuario || !perfil) return;
    const t = window.setTimeout(() => { void subir(repo, usuario.uid, perfil, codigo, null).catch(() => undefined); }, 3000);
    return () => window.clearTimeout(t);
  }, [repo, usuario, perfil, codigo]);
}

export function FilaEscritorio() {
  const { repo, usuario, perfil, cambiarPerfil, aviso } = useSesion();
  const [abierta, setAbierta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  if (Capacitor.isNativePlatform()) return null;
  const codigo = perfil.escritorio ?? null;

  /** Crea (o cambia) el código, sube el resumen y baja el paquete */
  const activar = async (nuevo: boolean) => {
    setOcupado(true);
    try {
      let c = codigo;
      if (!c || nuevo) {
        const anterior = c;
        c = nuevoCodigoEscritorio();
        await subir(repo, usuario.uid, perfil, c, null, true);
        await cambiarPerfil({ escritorio: c });
        if (anterior) await repo.borrarEscritorio(anterior).catch(() => undefined);
      }
      bajarArchivo(await paqueteEscritorio(APP, c), ARCHIVO);
      aviso(nuevo ? 'Enlace nuevo: el widget anterior dejó de andar' : `Se bajó ${ARCHIVO}: abrilo con doble clic`);
    } catch {
      aviso('No se pudo armar el widget. Probá de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  const desactivar = async () => {
    if (!codigo) return;
    setOcupado(true);
    try {
      await repo.borrarEscritorio(codigo).catch(() => undefined);
      await cambiarPerfil({ escritorio: null });
      aviso('Widget de escritorio desactivado');
      setAbierta(false);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <button className="fila w-full text-left" onClick={() => setAbierta(true)} data-testid="widget-escritorio">
        <Icono n="pc" className="oro" />
        <span className="flex-1"><b>Widget para Windows</b>
          <span className="block text-[12.5px] text-mu">{codigo ? 'Activado · tus rutinas y tu racha en el escritorio' : 'Tus rutinas de hoy y tu racha en el escritorio'}</span></span>
        <Icono n="atras" size={20} className="rotate-180 text-mu" />
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} etiqueta="Escritorio" titulo="Widget para Windows">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px]">
          <li>Instalá <b>Rainmeter</b> (gratis) desde <a href="https://www.rainmeter.net" target="_blank" rel="noreferrer" className="oro font-semibold">rainmeter.net</a>.</li>
          <li>Tocá el botón de abajo: se baja {ARCHIVO}.</li>
          <li>Abrilo con doble clic y tocá <b>Install</b>. La tarjeta aparece en tu escritorio; arrastrala a donde quieras.</li>
          <li>Clic derecho en la tarjeta: <b>Siguiente rutina</b> o <b>Agregar otra tarjeta</b>. La lista de hoy está en Rainmeter → StoaGym → Hoy.</li>
        </ol>
        <p className="mt-3 text-[13.5px] text-mu">Se actualiza cada 15 minutos con lo que hacés en la app (en el celular o en la PC). Muestra solo los nombres de tus rutinas y tu racha.</p>
        <button className="btn mt-4 w-full" onClick={() => activar(false)} disabled={ocupado}>{codigo ? 'Descargar de nuevo' : 'Activar y descargar'}</button>
        {codigo && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-sec flex-1" onClick={() => activar(true)} disabled={ocupado}>Cambiar el enlace</button>
            <button className="btn-sec flex-1 text-miss" onClick={desactivar} disabled={ocupado}>Desactivar</button>
          </div>
        )}
      </Hoja>
    </>
  );
}
