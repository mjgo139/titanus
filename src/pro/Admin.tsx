import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { mensajeError } from '../data/repo';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Seccion } from '../ui/piezas';
import { ESPECIALIDADES } from './especialidades';
import { codigoNuevo } from './logica';
import { Medallon, fechaPro } from './piezas';
import type { Profesional, Solicitud } from './tipos';

/** Panel del admin: aprueba solicitudes y da de alta o de baja a los profesionales */
export default function Admin() {
  const { repo, admin, usuario, aviso, recargarProfesional } = useSesion();
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);
  const [pros, setPros] = useState<Profesional[]>([]);
  const [clientes, setClientes] = useState<Record<string, number>>({});

  const recargar = useCallback(async () => {
    const [s, p] = await Promise.all([repo.leerSolicitudes(), repo.leerProfesionales()]);
    setSolicitudes(s);
    setPros(p);
    // Cuántos clientes tiene cada uno (solo el número, sin datos personales)
    const n: Record<string, number> = {};
    await Promise.all(p.map(async (x) => { n[x.uid] = (await repo.leerClientes(x.uid).catch(() => [])).length; }));
    setClientes(n);
  }, [repo]);

  useEffect(() => { if (admin) recargar(); }, [admin, recargar]);
  if (!admin) return <Navigate to="/" replace />;

  async function aprobar(s: Solicitud) {
    try {
      const p = await repo.aprobarSolicitud(s, codigoNuevo(ESPECIALIDADES[s.tipo].prefijoCodigo));
      aviso(`${s.nombre} ya es ${ESPECIALIDADES[s.tipo].rol.toLowerCase()} · código ${p.codigo}`);
      if (s.uid === usuario.uid) await recargarProfesional();
      await recargar();
    } catch (e) { aviso(mensajeError(e)); }
  }

  const pendientes = solicitudes?.filter((s) => s.estado === 'pendiente') ?? [];
  return (
    <div>
      <Encabezado atras="/perfil" etiqueta="Administración" titulo="Profesionales"
        linea="Aprobá a quienes pueden llevar clientes. Solo vos ves esta pantalla." />
      {!solicitudes ? <Cargando /> : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Seccion titulo={`Solicitudes pendientes · ${pendientes.length}`}>
            {!pendientes.length && <p className="tarjeta py-6 text-center text-[13.5px] text-mu">No hay solicitudes nuevas.</p>}
            <ul className="flex flex-col gap-3">
              {pendientes.map((s) => (
                <li key={s.uid} className="tarjeta" data-testid="solicitud">
                  <div className="flex items-center gap-3">
                    <Medallon nombre={s.nombre} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{s.nombre}</div>
                      <div className="truncate text-[13.5px] text-mu">{ESPECIALIDADES[s.tipo].rol} · {s.email} · {fechaPro(s.fecha)}</div>
                    </div>
                  </div>
                  {s.mensaje && <p className="mt-2 text-[15px] italic text-tx2">“{s.mensaje}”</p>}
                  <div className="mt-3 flex gap-2">
                    <button className="btn h-10 flex-1 text-[15px]" onClick={() => aprobar(s)}><Icono n="check" size={16} />Aprobar</button>
                    <button className="btn-sec h-10 flex-1 text-[15px]" onClick={async () => { await repo.rechazarSolicitud(s.uid); aviso('Solicitud rechazada'); await recargar(); }}>Rechazar</button>
                  </div>
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion titulo={`Profesionales · ${pros.length}`}>
            {!pros.length && <p className="tarjeta py-6 text-center text-[13.5px] text-mu">Todavía no hay profesionales.</p>}
            <ul className="flex flex-col gap-3">
              {pros.map((p) => (
                <li key={p.uid} className={`tarjeta ${p.activo ? '' : 'opacity-60'}`} data-testid="profesional">
                  <div className="flex items-center gap-3">
                    <Medallon nombre={p.nombre} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{p.nombre}</div>
                      <div className="text-[13.5px] text-mu">{ESPECIALIDADES[p.tipo].rol} · <span className="marca oro">{p.codigo}</span> · {clientes[p.uid] ?? '…'} clientes</div>
                    </div>
                    <button className={`chip h-9 shrink-0 px-3 text-[12.5px] ${p.activo ? 'chip-on' : ''}`} aria-pressed={p.activo}
                      onClick={async () => {
                        await repo.cambiarEstadoProfesional(p.uid, !p.activo);
                        aviso(p.activo ? `${p.nombre} dado de baja` : `${p.nombre} activo de nuevo`);
                        if (p.uid === usuario.uid) await recargarProfesional();
                        await recargar();
                      }}>
                      {p.activo ? 'Activo' : 'De baja'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13.5px] text-mu2">Dar de baja corta el acceso a los datos de sus clientes al instante, sin borrar nada.</p>
          </Seccion>
        </div>
      )}
    </div>
  );
}
