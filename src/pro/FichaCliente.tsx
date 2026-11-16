import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Perfil } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Hoja } from '../ui/piezas';
import { ESP } from './especialidades';
import { estadoCliente } from './logica';
import { ChipEstado, Medallon, fechaPro } from './piezas';
import type { Comentario, Objetivo, Vinculo } from './tipos';
import { SECCIONES_ENTRENADOR } from './entrenador/Ficha';

/** Lo que cada sección de la ficha recibe, sea cual sea la especialidad */
export interface CtxFicha {
  vinculo: Vinculo;
  perfil: Perfil;
  comentarios: Comentario[];
  objetivos: Objetivo[];
  yo: { uid: string; nombre: string };
  recargarComentarios: () => Promise<void>;
  recargarObjetivos: () => Promise<void>;
  /** Para pasar de una sección a otra (por ejemplo "ver todos los entrenos") */
  irA: (seccion: string) => void;
}

export interface Seccion { id: string; titulo: string; Componente: ComponentType<CtxFicha> }

/** Base reutilizable: datos comunes y pestañas. Las pestañas las define cada especialidad. */
export default function FichaCliente() {
  const { uid: clienteId = '' } = useParams();
  const { repo, usuario, perfil: yoPerfil, profesional, aviso } = useSesion();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [vinculo, setVinculo] = useState<Vinculo | null | undefined>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [cortar, setCortar] = useState(false);
  const [error, setError] = useState(false);
  const secciones: Seccion[] = SECCIONES_ENTRENADOR;
  const actual = secciones.find((s) => s.id === params.get('ver'))?.id ?? secciones[0].id;

  const recargarComentarios = useCallback(async () => { setComentarios(await repo.leerComentarios(clienteId)); }, [repo, clienteId]);
  const recargarObjetivos = useCallback(async () => { setObjetivos(await repo.leerObjetivos(clienteId)); }, [repo, clienteId]);

  useEffect(() => {
    if (!profesional) return;
    (async () => {
      try {
        setError(false);
        const v = (await repo.leerClientes(usuario.uid)).find((x) => x.clienteId === clienteId) ?? null;
        setVinculo(v);
        if (!v) return;
        const [p] = await Promise.all([repo.leerPerfilDe(clienteId), recargarComentarios(), recargarObjetivos()]);
        if (!p) setError(true);
        setPerfil(p);
      } catch {
        setError(true);
      }
    })();
  }, [repo, usuario.uid, clienteId, profesional, recargarComentarios, recargarObjetivos]);

  if (!profesional) return <Navigate to="/" replace />;
  if (vinculo === null) return <Navigate to="/clientes" replace />;
  if (error) {
    return (
      <div>
        <Encabezado atras="/clientes" etiqueta="Cliente" titulo={vinculo?.nombreCliente ?? 'Cliente'} />
        <div className="tarjeta py-8 text-center" role="alert" data-testid="error-cliente">
          <Icono n="alerta" size={30} className="oro mx-auto" />
          <p className="mt-3 font-semibold">No se pudieron cargar los datos de este cliente.</p>
          <p className="mt-1 text-[14px] text-mu">Revisá tu conexión y probá de nuevo. Si sigue igual, puede que haya cortado el vínculo.</p>
          <button className="btn-sec mt-4" onClick={() => location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }
  if (!vinculo || !perfil) return <Cargando forma="pagina" />;

  const ctx: CtxFicha = {
    vinculo, perfil, comentarios, objetivos, yo: { uid: usuario.uid, nombre: yoPerfil.nombre },
    recargarComentarios, recargarObjetivos, irA: (s) => { setParams({ ver: s }, { replace: true }); window.scrollTo({ top: 0 }); },
  };
  const S = secciones.find((s) => s.id === actual)!.Componente;

  async function terminar() {
    await repo.terminarVinculo(vinculo!.id);
    aviso(`Dejaste de llevar a ${perfil!.nombre}`);
    nav('/clientes');
  }

  return (
    <div>
      <Encabezado atras="/clientes" etiqueta={`Cliente desde el ${fechaPro(vinculo.desde)}`}
        titulo={<span className="flex items-center gap-3"><Medallon nombre={perfil.nombre} tam={40} />{perfil.nombre}</span>}
        accion={<ChipEstado estado={estadoCliente(perfil.resumen.dias, Date.now())} />} />

      <nav aria-label="Secciones del cliente" className="sticky top-0 z-20 -mx-[17px] mb-4 overflow-x-auto border-b border-ln2 px-[17px] backdrop-blur lg:mx-0 lg:px-0"
        style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}>
        <div className="flex min-w-max gap-1">
          {secciones.map((s) => (
            <button key={s.id} role="tab" aria-selected={s.id === actual} onClick={() => ctx.irA(s.id)}
              className={`h-11 border-b-2 px-3 text-[14px] font-semibold transition-colors ${s.id === actual ? 'border-gold oro' : 'border-transparent text-mu hover:text-tx'}`}>
              {s.titulo}
            </button>
          ))}
        </div>
      </nav>

      <div key={actual} className="pagina"><S {...ctx} /></div>

      <button className="mt-10 flex w-full items-center justify-center gap-2 p-2 text-[14px] font-semibold text-miss" onClick={() => setCortar(true)}>
        <Icono n="salir" size={16} />Dejar de llevar a {perfil.nombre.split(' ')[0]}
      </button>

      <Hoja abierta={cortar} alCerrar={() => setCortar(false)} etiqueta="Confirmar" titulo={`¿Dejar de llevar a ${perfil.nombre}?`}>
        <p className="text-mu">Vas a dejar de ver sus datos. Sus entrenamientos quedan guardados en su cuenta y las rutinas que le asignaste las puede seguir usando. Para volver, {ESP.tuRol === 'tu entrenador' ? 'tiene que' : 'debe'} ingresar de nuevo tu código.</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn" style={{ background: 'var(--miss)', borderColor: 'var(--miss)', color: '#fff' }} onClick={terminar}>Sí, dejar de llevarlo</button>
          <button className="btn-sec" onClick={() => setCortar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
