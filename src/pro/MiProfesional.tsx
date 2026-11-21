import { useCallback, useEffect, useState } from 'react';
import type { EstadoEjercicio, RegistroCuerpo } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Hoja } from '../ui/piezas';
import { mensajeError } from '../data/repo';
import { ESP, TIPO_APP } from './especialidades';
import { normalizarCodigo } from './logica';
import { HiloComentarios, ListaObjetivos, Medallon, fechaHora, fechaPro } from './piezas';
import type { Comentario, Objetivo, Vinculo } from './tipos';
import { medirObjetivo } from './entrenador/medir';

const CLAVE_INVITACION = 'titanus-codigo';

/** Si se abrió la app con ?codigo=TIT-XXXX, se guarda para ofrecer la vinculación después de ingresar */
export function guardarInvitacionDeLaUrl() {
  try {
    const c = new URLSearchParams(location.search).get('codigo');
    if (c) {
      sessionStorage.setItem(CLAVE_INVITACION, normalizarCodigo(c));
      const u = new URL(location.href);
      u.searchParams.delete('codigo');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch { /* sin almacenamiento */ }
}
export function invitacionPendiente(): string | null {
  try { return sessionStorage.getItem(CLAVE_INVITACION); } catch { return null; }
}
function olvidarInvitacion() { try { sessionStorage.removeItem(CLAVE_INVITACION); } catch { /* nada */ } }

/** Formulario para ingresar el código: muestra qué va a poder ver el profesional antes de aceptar */
export function Vincular({ alListo }: { alListo: (v: Vinculo) => void }) {
  const { repo, usuario, perfil, aviso } = useSesion();
  const [codigo, setCodigo] = useState(invitacionPendiente() ?? '');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  async function vincular() {
    setError('');
    setEnviando(true);
    try {
      const v = await repo.vincular({ uid: usuario.uid, nombre: perfil.nombre }, codigo, TIPO_APP);
      olvidarInvitacion();
      aviso(`Listo: ${v.nombreProfesional} es ${ESP.tuRol}`);
      alListo(v);
    } catch (e) {
      setError(mensajeError(e));
    } finally { setEnviando(false); }
  }
  return (
    <div className="tarjeta" data-testid="vincular">
      <label className="block">
        <span className="etiqueta">Código de {ESP.tuRol}</span>
        <input className="campo mt-2 marca text-center text-[20px] tracking-[.14em] uppercase" placeholder="STG-XXXX" value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())} aria-label={`Código de ${ESP.tuRol}`} maxLength={12} />
      </label>
      <div className="mt-4 text-[15px]">
        <div className="font-semibold">Al vincularte, {ESP.tuRol} va a poder:</div>
        <ul className="mt-1 flex flex-col gap-1 text-mu">
          {ESP.permisos.map((p) => <li key={p} className="flex gap-2"><Icono n="check" size={16} className="oro mt-0.5 shrink-0" />{p}</li>)}
        </ul>
        <p className="mt-2 text-[13.5px] text-mu2">No ve tu correo ni tu contraseña. Podés cortar el vínculo cuando quieras.</p>
      </div>
      {error && <p className="mt-3 text-[15px] text-miss" role="alert">{error}</p>}
      <button className="btn mt-4 w-full" disabled={normalizarCodigo(codigo).length < 6 || enviando} onClick={vincular}>
        {enviando ? 'Vinculando…' : 'Aceptar y vincular'}
      </button>
    </div>
  );
}

/** Lo que ve el cliente: su profesional, objetivos y mensajes */
export default function MiProfesional() {
  const { repo, usuario, perfil, aviso } = useSesion();
  const [vinculos, setVinculos] = useState<Vinculo[] | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [datos, setDatos] = useState<{ estados: Map<string, EstadoEjercicio>; cuerpo: RegistroCuerpo[] } | null>(null);
  const [cortar, setCortar] = useState(false);

  const recargar = useCallback(async () => {
    const vs = (await repo.leerMisProfesionales(usuario.uid)).filter((v) => v.tipo === TIPO_APP);
    setVinculos(vs);
    if (!vs.length) return;
    const [ks, os, estados, cuerpo] = await Promise.all([
      repo.leerComentarios(usuario.uid), repo.leerObjetivos(usuario.uid), repo.leerEstados(usuario.uid), repo.leerCuerpo(usuario.uid),
    ]);
    setComentarios(ks);
    setObjetivos(os);
    setDatos({ estados, cuerpo });
    // Al abrir, lo que le escribió el profesional queda leído
    const nuevos = ks.filter((k) => !k.leido && k.autorId !== usuario.uid).map((k) => k.id);
    if (nuevos.length) await repo.marcarLeidos(usuario.uid, nuevos);
  }, [repo, usuario.uid]);

  useEffect(() => { recargar(); }, [recargar]);

  if (!vinculos) return <Cargando forma="pagina" />;
  const v = vinculos[0];

  if (!v) {
    return (
      <div className="lg:mx-auto lg:max-w-[560px]">
        <Encabezado atras="/perfil" etiqueta={ESP.rol} titulo={`Vinculate con ${ESP.tuRol}`}
          linea="Ingresá el código que te pasó para que pueda seguir tu entrenamiento." />
        <Vincular alListo={() => recargar()} />
      </div>
    );
  }

  const nuevos = comentarios.filter((k) => !k.leido && k.autorId !== usuario.uid);
  return (
    <div>
      <Encabezado atras="/" etiqueta={ESP.tuRol.replace(/^./, (c) => c.toUpperCase())} titulo={v.nombreProfesional}
        linea={`Te acompaña desde el ${fechaPro(v.desde)}.`} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section>
          <div className="tarjeta flex items-center gap-3">
            <Medallon nombre={v.nombreProfesional} tam={52} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[20px] font-semibold">{v.nombreProfesional}</div>
              <div className="text-[13.5px] text-mu">Ve tus entrenamientos y progreso · te asigna rutinas</div>
            </div>
          </div>
          <h2 className="etiqueta mb-2 mt-6">Tus objetivos</h2>
          {datos ? (
            <ListaObjetivos objetivos={objetivos} medir={(o) => medirObjetivo(o, { perfil, estados: datos.estados, cuerpo: datos.cuerpo }, Date.now(), perfil.unidad)} />
          ) : <Cargando />}
        </section>

        <section>
          <h2 className="etiqueta mb-2 flex items-center gap-2">Mensajes {nuevos.length > 0 && <span className="chip chip-on h-6 px-2 text-[11px]">{nuevos.length} nuevo{nuevos.length > 1 ? 's' : ''}</span>}</h2>
          {comentarios.filter((k) => k.sobre).length > 0 && (
            <ul className="mb-3 flex flex-col gap-2">
              {comentarios.filter((k) => k.sobre && k.autorId !== usuario.uid).slice(0, 5).map((k) => (
                <li key={k.id} className={`tarjeta py-3 ${nuevos.includes(k) ? 'border-gold' : ''}`} data-testid="comentario-entreno">
                  <div className="text-[12.5px] text-mu">Sobre <b className="oro">{k.sobre?.titulo}</b> · {fechaHora(k.fecha)}</div>
                  <p className="mt-1 text-[15px]">{k.texto}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="tarjeta">
            <HiloComentarios comentarios={comentarios.filter((k) => !k.sobre)} yo={{ uid: usuario.uid, nombre: perfil.nombre }}
              placeholder={`Escribile a ${v.nombreProfesional.split(' ')[0]}…`}
              alEnviar={async (k) => { await repo.guardarComentario(usuario.uid, k); await recargar(); }} />
          </div>
        </section>
      </div>

      <button className="mt-10 flex w-full items-center justify-center gap-2 p-2 text-[15px] font-semibold text-miss" onClick={() => setCortar(true)}>
        <Icono n="salir" size={16} />Dejar de compartir mis datos
      </button>
      <Hoja abierta={cortar} alCerrar={() => setCortar(false)} etiqueta="Confirmar" titulo={`¿Dejar a ${v.nombreProfesional}?`}>
        <p className="text-mu">Deja de ver tus datos al instante. Tus entrenamientos y las rutinas que te asignó quedan en tu cuenta.</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn btn-peligro"
            onClick={async () => { await repo.terminarVinculo(v.id); setCortar(false); aviso('Dejaste de compartir tus datos'); await recargar(); }}>Sí, dejar de compartir</button>
          <button className="btn-sec" onClick={() => setCortar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
