import { useState, type FormEvent } from 'react';
import { mensajeError } from '../data/repo';
import { CLAVE_PRUEBA, USUARIO_PRUEBA } from '../data/semilla';
import { fraseDelDia } from '../lib/frases';
import { useApp } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Logo } from '../ui/Marco';

type Vista = 'ingresar' | 'registrar' | 'recuperar';

export default function Acceso() {
  const { repo } = useApp();
  const prueba = repo.modo === 'prueba';
  const [vista, setVista] = useState<Vista>('ingresar');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(prueba ? USUARIO_PRUEBA.email : '');
  const [clave, setClave] = useState(prueba ? CLAVE_PRUEBA : '');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const frase = fraseDelDia();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(''); setInfo(''); setOcupado(true);
    try {
      if (vista === 'ingresar') await repo.ingresar(email, clave);
      else if (vista === 'registrar') await repo.registrar(nombre.trim(), email, clave);
      else {
        await repo.recuperarClave(email);
        setInfo('Listo. Si existe una cuenta con ese correo, te llegó un enlace para crear una contraseña nueva.');
      }
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setOcupado(false);
    }
  }

  async function google() {
    setError(''); setOcupado(true);
    try { await repo.ingresarConGoogle(); } catch (err) { setError(mensajeError(err)); } finally { setOcupado(false); }
  }

  const titulos: Record<Vista, [string, string, string]> = {
    ingresar: ['Acceso', 'Volvé al hierro', 'Cada serie cuenta. Ingresá para seguir tu plan.'],
    registrar: ['Cuenta nueva', 'Empezá hoy', 'Creá tu cuenta y armá tu primera rutina.'],
    recuperar: ['Contraseña', 'Recuperá el acceso', 'Te enviamos un enlace a tu correo.'],
  };
  const [et, ti, li] = titulos[vista];

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-[400px] flex-1 flex flex-col">
        <Logo />
        <div className="entrar mt-12">
          <div className="etiqueta">{et}</div>
          <h1 className="titulo mt-2">{ti}</h1>
          <p className="mt-2 text-mu font-medium">{li}</p>
        </div>

        <form onSubmit={enviar} className="mt-8 flex flex-col gap-5" noValidate>
          {vista === 'registrar' && (
            <label className="block">
              <span className="etiqueta">Nombre</span>
              <input className="campo-linea" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" required />
            </label>
          )}
          <label className="block">
            <span className="etiqueta">Correo</span>
            <input className="campo-linea" type="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          {vista !== 'recuperar' && (
            <label className="block">
              <span className="etiqueta">Contraseña</span>
              <input className="campo-linea" type="password" value={clave} onChange={(e) => setClave(e.target.value)}
                autoComplete={vista === 'registrar' ? 'new-password' : 'current-password'} required minLength={6} />
            </label>
          )}

          {error && <p role="alert" className="rounded-xl bg-missbg text-miss px-4 py-3 text-[14px] font-medium">{error}</p>}
          {info && <p role="status" className="rounded-xl bg-okbg text-ok px-4 py-3 text-[14px] font-medium">{info}</p>}

          <button className="btn w-full mt-2" disabled={ocupado}>
            {vista === 'ingresar' ? 'Entrar' : vista === 'registrar' ? 'Crear cuenta' : 'Enviar enlace'}
          </button>
        </form>

        {vista !== 'recuperar' && repo.permiteGoogle && (
          <button onClick={google} disabled={ocupado} className="btn-sec w-full mt-4 text-tx">
            <Icono n="google" size={18} /> Continuar con Google
          </button>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 text-[14px] font-semibold text-gold">
          {vista === 'ingresar' && <>
            <button onClick={() => setVista('recuperar')}>Olvidé mi contraseña</button>
            <button onClick={() => setVista('registrar')}>¿No tenés cuenta? Creala</button>
          </>}
          {vista !== 'ingresar' && <button onClick={() => setVista('ingresar')}>Ya tengo cuenta</button>}
        </div>

        {prueba && (
          <p className="mt-6 text-center text-[13px] text-mu">Modo prueba: la cuenta de ejemplo ya está cargada.</p>
        )}

        <blockquote className="mt-auto pt-12 text-center">
          <p className="font-display font-semibold text-[17px] leading-snug text-tx2">“{frase.texto}”</p>
          <footer className="etiqueta mt-3">{frase.autor}</footer>
        </blockquote>
      </div>
    </div>
  );
}
