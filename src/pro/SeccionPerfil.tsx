import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mensajeError } from '../data/repo';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Hoja, Seccion } from '../ui/piezas';
import { ESP, TIPO_APP } from './especialidades';
import type { Solicitud, Vinculo } from './tipos';

/** En Perfil: tu entrenador, tu panel de clientes (si sos profesional), pedir serlo y la administración */
export function SeccionPro() {
  const { repo, usuario, perfil, profesional, admin, aviso } = useSesion();
  const [vinculo, setVinculo] = useState<Vinculo | null | undefined>();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [pedir, setPedir] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    repo.leerMisProfesionales(usuario.uid).then((vs) => setVinculo(vs.find((v) => v.tipo === TIPO_APP) ?? null)).catch(() => setVinculo(null));
    if (!profesional) repo.leerMiSolicitud(usuario.uid).then(setSolicitud).catch(() => undefined);
  }, [repo, usuario.uid, profesional]);

  async function enviar() {
    setError('');
    const s: Solicitud = {
      uid: usuario.uid, tipo: TIPO_APP, nombre: nombre.trim() || perfil.nombre, email: usuario.email,
      ...(mensaje.trim() ? { mensaje: mensaje.trim().slice(0, 500) } : {}), fecha: Date.now(), estado: 'pendiente',
    };
    try {
      await repo.enviarSolicitud(s);
      setSolicitud(s);
      setPedir(false);
      aviso('Solicitud enviada');
    } catch (e) { setError(mensajeError(e)); }
  }

  const fila = 'fila w-full text-left';
  return (
    <Seccion titulo={ESP.rol}>
      <div className="tarjeta py-1" data-testid="seccion-pro">
        {profesional && (
          <Link to="/clientes" className={fila}>
            <Icono n="clientes" className="oro" />
            <span className="flex-1"><b>Panel de clientes</b><span className="block text-[12px] text-mu">Tu código: <span className="marca oro">{profesional.codigo}</span></span></span>
            <Icono n="atras" size={18} className="rotate-180 text-mu" />
          </Link>
        )}
        <Link to="/mi-entrenador" className={fila}>
          <Icono n="escudo" className="oro" />
          <span className="flex-1">
            {vinculo ? <><b>{ESP.tuRol.replace(/^./, (c) => c.toUpperCase())}: {vinculo.nombreProfesional}</b><span className="block text-[12px] text-mu">Objetivos, mensajes y rutinas</span></>
              : <><b>Tengo un código de {ESP.rol.toLowerCase()}</b><span className="block text-[12px] text-mu">Para que siga tu entrenamiento</span></>}
          </span>
          <Icono n="atras" size={18} className="rotate-180 text-mu" />
        </Link>
        {!profesional && !usuario.invitado && (
          solicitud?.estado === 'pendiente' ? (
            <div className={`${fila} ${admin ? '' : 'border-0'}`} data-testid="solicitud-pendiente">
              <Icono n="reloj" className="text-mu" /><span className="flex-1"><b>Pediste ser {ESP.rol.toLowerCase()}</b><span className="block text-[12px] text-mu">Te avisamos acá cuando se apruebe.</span></span>
            </div>
          ) : (
            <button className={`${fila} ${admin ? '' : 'border-0'}`} onClick={() => setPedir(true)}>
              <Icono n="clientes" className="text-mu" />
              <span className="flex-1"><b>Soy {ESP.rol.toLowerCase()}: quiero llevar clientes</b>
                <span className="block text-[12px] text-mu">{solicitud?.estado === 'rechazada' ? 'Tu pedido anterior no se aprobó. Podés volver a pedir.' : 'Pedí acceso al panel profesional.'}</span></span>
            </button>
          )
        )}
        {admin && (
          <Link to="/admin" className={`${fila} border-0`}>
            <Icono n="corona" className="oro" /><span className="flex-1"><b>Administrar profesionales</b><span className="block text-[12px] text-mu">Solicitudes, altas y bajas</span></span>
            <Icono n="atras" size={18} className="rotate-180 text-mu" />
          </Link>
        )}
      </div>

      <Hoja abierta={pedir} alCerrar={() => setPedir(false)} etiqueta="Panel profesional" titulo={`Ser ${ESP.rol.toLowerCase()} en StoaGym`}>
        <p className="text-[14px] text-mu">Vas a poder llevar clientes: ver su progreso, asignarles rutinas, comentar sus entrenamientos y fijarles objetivos. Lo aprueba el administrador.</p>
        <label className="mt-4 block"><span className="etiqueta">Nombre que van a ver tus clientes</span>
          <input className="campo mt-2" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} aria-label="Nombre profesional" />
        </label>
        <label className="mt-3 block"><span className="etiqueta">Contanos sobre vos (opcional)</span>
          <textarea className="campo mt-2 h-24 py-2" value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={500}
            placeholder="Dónde trabajás, cuántos alumnos tenés…" aria-label="Mensaje para el administrador" />
        </label>
        {error && <p className="mt-2 text-[14px] text-miss" role="alert">{error}</p>}
        <button className="btn mt-4 w-full" onClick={enviar}>Enviar solicitud</button>
      </Hoja>
    </Seccion>
  );
}
