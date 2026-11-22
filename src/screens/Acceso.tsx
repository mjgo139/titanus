import { AvisoMudanza } from '../ui/AvisoMudanza';
import { useState } from 'react';
import portada from '../../familia/portada-filosofo.webp';
import { mensajeError } from '../data/repo';
import { CLAVE_PRUEBA, USUARIO_PRUEBA } from '../data/semilla';
import { useApp } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Emblema, FormularioAcceso, PantallaAcceso, PortadaAcceso, type VistaAcceso } from '../ui/familia';

export type { VistaAcceso };

/** Formulario de acceso (pieza de la familia): en la pantalla de acceso y en Perfil (el invitado crea su cuenta) */
export function FormAcceso({ inicial, alTerminar, enHoja }: { inicial: VistaAcceso; alTerminar?: () => void; enHoja?: boolean }) {
  const { repo, usuario } = useApp();
  const [vista, setVista] = useState<VistaAcceso>(inicial);
  const prueba = repo.modo === 'prueba' && inicial === 'ingresar';
  return (
    <FormularioAcceso vista={vista} alCambiarVista={setVista} mensajeError={mensajeError} alTerminar={alTerminar} sinTitulo={enHoja && vista === inicial}
      inicial={prueba ? { email: USUARIO_PRUEBA.email, clave: CLAVE_PRUEBA } : undefined}
      nota={vista === 'registrar' && usuario?.invitado ? 'Tu progreso de invitado queda guardado en tu cuenta nueva.' : undefined}
      acciones={{
        ingresar: (email, clave) => repo.ingresar(email, clave),
        registrar: (nombre, email, clave) => repo.registrar(nombre, email, clave),
        recuperar: (email) => repo.recuperarClave(email),
        google: repo.permiteGoogle ? () => repo.ingresarConGoogle() : undefined,
      }} />
  );
}

export default function Acceso() {
  const { repo } = useApp();
  const [vista, setVista] = useState<VistaAcceso | null>(null);
  const [error, setError] = useState('');

  async function invitado() {
    setError('');
    try { await repo.ingresarComoInvitado(); } catch (e) { setError(mensajeError(e)); }
  }

  if (vista) {
    return (
      <PantallaAcceso emblema={<Emblema size={72} />} nombre="StoaGym" alVolver={() => setVista(null)}>
        <FormAcceso key={vista} inicial={vista} />
      </PantallaAcceso>
    );
  }

  return (
    <PortadaAcceso imagen={portada} emblema={<Emblema size={92} />} nombre="StoaGym" lema="Entrenamiento · Disciplina · Fuerza"
      frase="Registrá cada serie, superá tus marcas y forjá la disciplina de un legionario." aviso={<AvisoMudanza className="mb-5 flex" />}>
      <button className="btn" onClick={() => setVista('ingresar')}><Icono n="corona" size={20} />Iniciar sesión</button>
      <button className="btn-sec" onClick={() => setVista('registrar')}>Crear cuenta</button>
      <button className="portada-invitado" onClick={invitado}>Continuar como invitado</button>
      {error && <p role="alert" className="text-miss text-[15px]">{error}</p>}
      {repo.modo === 'prueba' && <p className="text-[12.5px] text-mu2">Modo prueba: la cuenta de ejemplo ya está cargada en "Iniciar sesión".</p>}
    </PortadaAcceso>
  );
}
