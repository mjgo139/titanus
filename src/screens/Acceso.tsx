import { useState, type FormEvent } from 'react';
import busto from '../assets/busto.webp';
import { mensajeError } from '../data/repo';
import { CLAVE_PRUEBA, USUARIO_PRUEBA } from '../data/semilla';
import { useApp } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Logo } from '../ui/Marco';
import { Hoja } from '../ui/piezas';

export type VistaAcceso = 'ingresar' | 'registrar' | 'recuperar';

/** Formulario de acceso: se usa en la portada y en Perfil (para que el invitado cree su cuenta) */
export function FormAcceso({ inicial, alTerminar }: { inicial: VistaAcceso; alTerminar?: () => void }) {
  const { repo, usuario } = useApp();
  const prueba = repo.modo === 'prueba';
  const [vista, setVista] = useState<VistaAcceso>(inicial);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(prueba && inicial === 'ingresar' ? USUARIO_PRUEBA.email : '');
  const [clave, setClave] = useState(prueba && inicial === 'ingresar' ? CLAVE_PRUEBA : '');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(''); setInfo(''); setOcupado(true);
    try {
      if (vista === 'ingresar') await repo.ingresar(email, clave);
      else if (vista === 'registrar') await repo.registrar(nombre.trim(), email, clave);
      else {
        await repo.recuperarClave(email);
        setInfo('Listo. Si existe una cuenta con ese correo, te llegó un enlace para crear una contraseña nueva.');
        return;
      }
      alTerminar?.();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setOcupado(false);
    }
  }

  async function google() {
    setError(''); setOcupado(true);
    try { await repo.ingresarConGoogle(); alTerminar?.(); } catch (err) { setError(mensajeError(err)); } finally { setOcupado(false); }
  }

  return (
    <div>
      <p className="text-mu -mt-2 mb-4">
        {vista === 'registrar' && usuario?.invitado ? 'Tu progreso de invitado queda guardado en tu cuenta nueva.'
          : vista === 'recuperar' ? 'Te enviamos un enlace a tu correo.' : 'Bienvenido al camino del legionario.'}
      </p>
      <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
        {vista === 'registrar' && (
          <input className="campo" placeholder="Tu nombre" aria-label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" />
        )}
        <input className="campo" type="email" inputMode="email" placeholder="Correo electrónico" aria-label="Correo"
          value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        {vista !== 'recuperar' && (
          <input className="campo" type="password" placeholder="Contraseña" aria-label="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)}
            autoComplete={vista === 'registrar' ? 'new-password' : 'current-password'} />
        )}
        {error && <p role="alert" className="rounded-[10px] bg-missbg text-miss px-4 py-3 text-[14px] font-medium">{error}</p>}
        {info && <p role="status" className="rounded-[10px] bg-okbg oro px-4 py-3 text-[14px] font-medium">{info}</p>}
        <button className="btn w-full mt-1" disabled={ocupado}>
          {vista === 'ingresar' ? 'Entrar' : vista === 'registrar' ? 'Crear cuenta' : 'Enviar enlace'}
        </button>
      </form>
      {vista !== 'recuperar' && repo.permiteGoogle && (
        <button onClick={google} disabled={ocupado} className="btn-sec w-full mt-3">
          <Icono n="google" size={18} /> Continuar con Google
        </button>
      )}
      <div className="mt-5 flex flex-col items-center gap-3 text-[14px] font-semibold oro">
        {vista === 'ingresar' && <>
          <button onClick={() => setVista('recuperar')}>Olvidé mi contraseña</button>
          <button onClick={() => setVista('registrar')}>¿No tenés cuenta? Creala</button>
        </>}
        {vista !== 'ingresar' && <button onClick={() => setVista('ingresar')}>Ya tengo cuenta</button>}
      </div>
    </div>
  );
}

export default function Acceso() {
  const { repo } = useApp();
  const [modal, setModal] = useState<VistaAcceso | null>(null);
  const [error, setError] = useState('');

  async function invitado() {
    setError('');
    try { await repo.ingresarComoInvitado(); } catch (e) { setError(mensajeError(e)); }
  }

  const titulos: Record<VistaAcceso, string> = { ingresar: 'Iniciar sesión', registrar: 'Crear cuenta', recuperar: 'Recuperá el acceso' };

  return (
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col justify-between px-[26px] pb-12 pt-8 text-center">
      <div className="entrar">
        <Logo grande />
        <div className="mt-2 text-[12px] tracking-[.14em] text-tx2">ENTRENAMIENTO · DISCIPLINA · FUERZA</div>
      </div>
      <div className="mascara-vert -mx-[26px] my-[-10px] h-[43vh] min-h-[260px] max-h-[480px] bg-cover bg-no-repeat"
        role="img" aria-label="Estatua romana" style={{ backgroundImage: `url(${busto})`, backgroundPosition: 'center 30%' }} />
      <div className="grid gap-3">
        <button className="btn w-full" onClick={() => setModal('ingresar')}><Icono n="corona" size={18} />Iniciar sesión</button>
        <button className="btn-sec w-full h-[52px] text-[16px]" onClick={() => setModal('registrar')}>Crear cuenta</button>
        <button className="p-2 text-[15px] text-tx2" onClick={invitado}>Continuar como invitado</button>
        {error && <p role="alert" className="text-miss text-[14px]">{error}</p>}
        {repo.modo === 'prueba' && <p className="text-[12px] text-mu2">Modo prueba: la cuenta de ejemplo ya está cargada en "Iniciar sesión".</p>}
      </div>

      <Hoja abierta={!!modal} alCerrar={() => setModal(null)} titulo={modal ? titulos[modal] : ''}>
        {modal && <FormAcceso key={modal} inicial={modal} />}
      </Hoja>
    </div>
  );
}
