import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { ESP, TIPO_APP } from './especialidades';
import { estadoCliente } from './logica';
import { invitacionPendiente } from './MiProfesional';
import { Medallon } from './piezas';
import type { Comentario, Vinculo } from './tipos';

/** En Inicio: mensajes de tu entrenador, una invitación pendiente o (si sos profesional) quién necesita atención */
export function AvisoHoy() {
  const { repo, usuario, profesional } = useSesion();
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [nuevos, setNuevos] = useState<Comentario[]>([]);
  const [atencion, setAtencion] = useState<string[]>([]);
  const invitacion = invitacionPendiente();

  useEffect(() => {
    (async () => {
      const v = (await repo.leerMisProfesionales(usuario.uid).catch(() => [])).find((x) => x.tipo === TIPO_APP) ?? null;
      setVinculo(v);
      if (v) setNuevos((await repo.leerComentarios(usuario.uid).catch(() => [])).filter((k) => !k.leido && k.autorId !== usuario.uid));
      if (profesional) {
        const cs = await repo.leerClientes(usuario.uid).catch(() => []);
        const ps = await Promise.all(cs.map((c) => repo.leerPerfilDe(c.clienteId).catch(() => null)));
        setAtencion(cs.filter((_, i) => ['atencion', 'inactivo'].includes(estadoCliente(ps[i]?.resumen.dias ?? [], Date.now()))).map((c) => c.nombreCliente.split(' ')[0]));
      }
    })();
  }, [repo, usuario.uid, profesional]);

  return (
    <div className="mb-4 flex flex-col gap-3 empty:hidden">
      {!vinculo && invitacion && (
        <Link to="/mi-entrenador" className="tarjeta entrar flex items-center gap-3 border-gold" data-testid="aviso-invitacion">
          <Icono n="enlace" className="oro shrink-0" />
          <span className="flex-1 text-[14px]">Tenés una invitación de {ESP.rol.toLowerCase()} (<b className="marca oro">{invitacion}</b>). <b className="oro">Revisala y aceptá</b>.</span>
        </Link>
      )}
      {vinculo && (
        <Link to="/mi-entrenador" className={`tarjeta entrar flex items-center gap-3 ${nuevos.length ? 'border-gold' : ''}`} data-testid="aviso-entrenador">
          <Medallon nombre={vinculo.nombreProfesional} tam={40} />
          <span className="min-w-0 flex-1">
            <span className="etiqueta oro">{ESP.tuRol.replace(/^./, (c) => c.toUpperCase())} · {vinculo.nombreProfesional}</span>
            <span className="block truncate text-[14px]">{nuevos.length ? `“${nuevos[0].texto}”` : 'Objetivos y mensajes'}</span>
          </span>
          {nuevos.length > 0 && <span className="chip chip-on h-7 shrink-0 px-2 text-[12px]">{nuevos.length} nuevo{nuevos.length > 1 ? 's' : ''}</span>}
        </Link>
      )}
      {profesional && atencion.length > 0 && (
        <Link to="/clientes" className="tarjeta entrar flex items-center gap-3" data-testid="aviso-atencion">
          <Icono n="alerta" className="oro shrink-0" />
          <span className="flex-1 text-[14px]"><b>{atencion.length === 1 ? `${atencion[0]} necesita` : `${atencion.length} clientes necesitan`} atención</b>
            <span className="block text-mu">{atencion.slice(0, 3).join(', ')}{atencion.length > 3 ? '…' : ''} hace días que no entrena{atencion.length > 1 ? 'n' : ''}.</span></span>
        </Link>
      )}
    </div>
  );
}
