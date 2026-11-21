import { DIRECCION } from '../ui/AvisoMudanza';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { rachaSemanas, semanaActual } from '../lib/logica';
import type { Perfil } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Selector, Vacio } from '../ui/piezas';
import { ESP } from './especialidades';
import { diasSinActividad, estadoCliente, ordenarClientes, vecesEstaSemana, type EstadoCliente } from './logica';
import { ChipEstado, Dato, Medallon } from './piezas';
import type { Vinculo } from './tipos';

interface Fila { vinculo: Vinculo; perfil: Perfil | null; estado: EstadoCliente; sin?: number; semana: number }
type Filtro = 'todos' | 'atencion' | 'al-dia' | 'nuevo';

export function textoUltimo(sin: number | undefined): string {
  if (sin === undefined) return 'Todavía no registró entrenamientos';
  if (sin === 0) return 'Entrenó hoy';
  if (sin === 1) return 'Entrenó ayer';
  return `Último entreno hace ${sin} días`;
}

/** Enlace para invitar: abre la app con el código ya cargado */
export function enlaceInvitacion(codigo: string): string {
  // Siempre la dirección nueva (aunque el entrenador abra la app desde la vieja o desde la APK)
  const base = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? location.origin : DIRECCION;
  return `${base}/?codigo=${encodeURIComponent(codigo)}`;
}

/** Panel del profesional: todos sus clientes, quién necesita atención y el código para sumar más */
export default function PanelClientes() {
  const { repo, usuario, profesional, aviso } = useSesion();
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const ahora = Date.now();

  useEffect(() => {
    if (!profesional) return;
    (async () => {
      const vs = await repo.leerClientes(usuario.uid).catch(() => [] as Vinculo[]);
      const l = await Promise.all(vs.map(async (vinculo) => {
        const perfil = await repo.leerPerfilDe(vinculo.clienteId).catch(() => null);
        const dias = perfil?.resumen.dias ?? [];
        return { vinculo, perfil, estado: estadoCliente(dias, ahora), sin: diasSinActividad(dias, ahora), semana: vecesEstaSemana(dias, ahora) };
      }));
      setFilas(ordenarClientes(l));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, usuario.uid, profesional]);

  if (!profesional) return <Navigate to="/" replace />;

  const atencion = filas?.filter((f) => f.estado === 'atencion' || f.estado === 'inactivo').length ?? 0;
  const visibles = (filas ?? []).filter((f) => filtro === 'todos' || f.estado === filtro || (filtro === 'atencion' && f.estado === 'inactivo'));
  const texto = `Sumate a StoaGym para que lleve tus entrenamientos. Abrí ${enlaceInvitacion(profesional.codigo)} o ingresá mi código ${profesional.codigo} en Perfil → ${ESP.rol}.`;

  async function copiar() {
    try { await navigator.clipboard.writeText(texto); aviso('Invitación copiada'); } catch { aviso(profesional!.codigo); }
  }

  return (
    <div>
      <Encabezado etiqueta={`Panel de ${ESP.rol.toLowerCase()}`} titulo="Tus clientes"
        linea="Quién entrena, quién necesita un empujón y cómo va cada uno." />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid grid-cols-3 gap-2" data-testid="resumen-clientes">
          <Dato etiqueta="Clientes" valor={filas?.length ?? '—'} />
          <Dato etiqueta="Activos" valor={filas ? filas.filter((f) => f.semana > 0).length : '—'} />
          <Dato etiqueta="Atención" valor={atencion} alerta={atencion > 0} />
        </div>

        <div className="hero flex items-center gap-3 px-4 py-3 text-left" data-testid="codigo-invitacion">
          <div className="min-w-0 flex-1">
            <div className="etiqueta">Tu código de invitación</div>
            <div className="marca mt-1 text-[26px] tracking-[.12em] oro">{profesional.codigo}</div>
          </div>
          <button className="btn-sec h-10 w-10 shrink-0 px-0" aria-label="Copiar invitación" onClick={copiar}><Icono n="copiar" size={20} /></button>
          <a className="btn h-10 shrink-0 px-3 text-[13.5px]" target="_blank" rel="noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(texto)}`}><Icono n="enlace" size={16} />Invitar</a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[20px] font-semibold">Clientes</h2>
        <div className="w-full sm:w-auto">
          <Selector nombre="Filtrar clientes" valor={filtro} alCambiar={setFiltro}
            opciones={[{ v: 'todos', t: 'Todos' }, { v: 'atencion', t: 'Atención' }, { v: 'al-dia', t: 'Al día' }, { v: 'nuevo', t: 'Nuevos' }]} />
        </div>
      </div>

      {!filas ? <Cargando /> : filas.length === 0 ? (
        <div className="mt-3">
          <Vacio titulo="Todavía no tenés clientes" linea={`Compartí tu código ${profesional.codigo}: tus clientes lo ingresan en Perfil → ${ESP.rol} y aceptan compartir sus datos.`} />
        </div>
      ) : visibles.length === 0 ? (
        <p className="tarjeta mt-3 py-6 text-center text-mu">Nadie en este grupo.</p>
      ) : (
        <ul className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {visibles.map((f) => {
            const dias = f.perfil?.resumen.dias ?? [];
            return (
              <li key={f.vinculo.id}>
                <Link to={`/clientes/${f.vinculo.clienteId}`} className="tarjeta entrar flex h-full flex-col transition-colors hover:border-gold2" data-testid="cliente">
                  <div className="flex items-center gap-3">
                    <Medallon nombre={f.vinculo.nombreCliente} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[18px] font-semibold">{f.perfil?.nombre || f.vinculo.nombreCliente}</div>
                      <div className={`text-[13.5px] ${f.estado === 'inactivo' ? 'text-miss' : 'text-mu'}`}>{textoUltimo(f.sin)}</div>
                    </div>
                    <ChipEstado estado={f.estado} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex gap-1" aria-label="Esta semana">
                      {semanaActual(dias, ahora).map((d, i) => (
                        <span key={i} className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${d.hecho ? 'border-goldh' : d.hoy ? 'border-gold oro' : 'border-ln2 text-mu2'}`}
                          style={d.hecho ? { background: 'var(--oro-grad)', color: 'var(--on)' } : undefined}>{d.letra}</span>
                      ))}
                    </div>
                    <div className="text-right text-[12.5px] text-mu">
                      <span className="num oro text-[15px]">{f.perfil?.resumen.total ?? 0}</span> entrenos · racha <span className="num oro text-[15px]">{rachaSemanas(dias, ahora)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
