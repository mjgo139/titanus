import { AvisoMudanza } from '../ui/AvisoMudanza';
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
  const [verClave, setVerClave] = useState(false);
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
          <div className="relative">
            <input className="campo w-full pr-12" type={verClave ? 'text' : 'password'} placeholder="Contraseña" aria-label="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)}
              autoComplete={vista === 'registrar' ? 'new-password' : 'current-password'} />
            <button type="button" onClick={() => setVerClave((v) => !v)} aria-pressed={verClave}
              aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-mu hover:oro">
              <Icono n={verClave ? 'ojo-no' : 'ojo'} size={20} />
            </button>
          </div>
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
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col justify-between px-[26px] pb-12 pt-8 text-center lg:max-w-[1200px] lg:flex-row lg:items-center lg:gap-14 lg:py-10">
      <div className="mascara-vert order-2 -mx-[26px] my-[-10px] h-[43vh] min-h-[260px] max-h-[480px] bg-cover bg-no-repeat lg:order-1 lg:m-0 lg:h-[84vh] lg:max-h-[820px] lg:w-[55%] lg:rounded-[20px]"
        role="img" aria-label="Estatua romana" style={{ backgroundImage: `url(${busto})`, backgroundPosition: 'center 30%' }} />
      <div className="contents lg:order-2 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:gap-12">
        <div className="entrar order-1">
          <AvisoMudanza className="mb-5 flex" />
          <Logo grande />
          <div className="mt-2 text-[12px] tracking-[.14em] text-tx2">ENTRENAMIENTO · DISCIPLINA · FUERZA</div>
          <p className="mx-auto mt-6 hidden max-w-[380px] font-display text-[18px] italic text-tx2 lg:block">Registrá cada serie, superá tus marcas y forjá la disciplina de un legionario.</p>
        </div>
        <div className="order-3 grid gap-3 lg:mx-auto lg:w-full lg:max-w-[380px]">
          <button className="btn w-full" onClick={() => setModal('ingresar')}><Icono n="corona" size={18} />Iniciar sesión</button>
          <button className="btn-sec w-full h-[52px] text-[16px]" onClick={() => setModal('registrar')}>Crear cuenta</button>
          <button className="p-2 text-[15px] text-tx2" onClick={invitado}>Continuar como invitado</button>
          {error && <p role="alert" className="text-miss text-[14px]">{error}</p>}
          {repo.modo === 'prueba' && <p className="text-[12px] text-mu2">Modo prueba: la cuenta de ejemplo ya está cargada en "Iniciar sesión".</p>}
        </div>
      </div>

      <Hoja abierta={!!modal} alCerrar={() => setModal(null)} titulo={modal ? titulos[modal] : ''}>
        {modal && <FormAcceso key={modal} inicial={modal} />}
      </Hoja>
    </div>
  );
}
