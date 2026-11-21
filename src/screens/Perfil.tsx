import { CabeceraPagina } from '../ui/familia';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { mensajeError } from '../data/repo';
import { NOMBRES_DIA, aUnidad, formatoNumero, rachaSemanas, rango, redondear, romano } from '../lib/logica';
import { SOBRECARGA_POR_DEFECTO } from '../lib/sobrecarga';
import { FormAcceso } from './Acceso';
import { COMMIT, FECHA_ARMADO, NOVEDADES, VERSION } from '../lib/novedades';
import { esNativo, programarRecordatorios } from '../lib/recordatorios';
import type { ModoSobrecarga, Recordatorio, Tema, Unidad, Figura } from '../lib/tipos';
import { estatuas } from '../ui/estatuas';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Hoja, Seccion, Selector } from '../ui/piezas';
import { TEMAS } from '../ui/familia';
import { SeccionPro } from '../pro/SeccionPerfil';

export default function Perfil() {
  const { repo, usuario, perfil, admin, cambiarPerfil, aviso } = useSesion();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [borrar, setBorrar] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [novedades, setNovedades] = useState(false);
  const [crear, setCrear] = useState(false);
  const r = perfil.recordatorio;
  const rg = rango(perfil.resumen.total);
  const sc = perfil.sobrecarga ?? SOBRECARGA_POR_DEFECTO;
  const racha = rachaSemanas(perfil.resumen.dias);

  async function guardarRecordatorio(n: Recordatorio) {
    await cambiarPerfil({ recordatorio: n });
    const res = await programarRecordatorios(n);
    if (res === 'sin-permiso') aviso('Activá las notificaciones de StoaGym en tu teléfono');
  }

  async function exportar() {
    const datos = await repo.exportar(usuario.uid);
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `titanus-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    aviso('Descargaste tus datos');
  }

  async function borrarCuenta() {
    setError('');
    try {
      await repo.borrarCuenta();
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  return (
    <div>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-10">
      <div className="lg:sticky lg:top-6">
      <div className="mt-6 mb-5"><CabeceraPagina etiqueta="Tu cuenta" titulo="Perfil" linea="Datos, apariencia y ajustes." /></div>
      <div className="text-center">
        <img src={estatuas(perfil.figura).avatar} alt="" className="mx-auto h-[100px] w-[100px] rounded-full border-2 border-gold object-cover" />
        <h2 className="mt-3 font-display text-[26px] font-semibold">{perfil.nombre}</h2>
        <p className="oro mt-1">{rg.nombre} · Nivel {rg.nivel}</p>
        {rg.siguiente && (
          <div className="mx-auto mt-3 max-w-[260px]">
            <div className="h-1.5 overflow-hidden rounded-full bg-ln2"><div className="h-full" style={{ width: `${Math.round(rg.progreso * 100)}%`, background: 'var(--oro-grad)' }} /></div>
            <p className="mt-1 text-[12.5px] text-mu">Faltan {rg.faltan} entrenamientos para {rg.siguiente}</p>
          </div>
        )}
        {!usuario.invitado && usuario.email && <p className="mt-1 text-[13.5px] text-mu2">{usuario.email}</p>}
      </div>

      <div className="tarjeta mt-6 py-1">
        <div className="flex justify-between border-b border-ln2 py-[13px]"><span>Entrenamientos completados</span><strong className="num" data-testid="completados">{perfil.resumen.total}</strong></div>
        <div className="flex justify-between border-b border-ln2 py-[13px]"><span>Racha actual</span><strong className="num">{racha ? `${romano(racha)} · ${racha} ${racha === 1 ? 'semana' : 'semanas'}` : '—'}</strong></div>
        <div className="flex justify-between py-[13px]"><span>Rango</span><strong className="oro">{rg.nombre}</strong></div>
      </div>

      {usuario.invitado && (
        <div className="hero mt-4 text-left">
          <div className="etiqueta oro">Modo invitado</div>
          <p className="mt-2 text-[15px] text-tx2">Creá tu cuenta para guardar tu progreso y usarlo en cualquier dispositivo. No perdés nada de lo registrado.</p>
          <button className="btn mt-4 w-full" onClick={() => setCrear(true)}>Crear mi cuenta</button>
        </div>
      )}

      </div>
      <div className="lg:pt-16">
      <Seccion n={1} titulo="Nombre">
        <div className="flex gap-2">
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre" />
          <button className="btn-sec h-[46px] shrink-0" disabled={!nombre.trim() || nombre === perfil.nombre}
            onClick={async () => { await cambiarPerfil({ nombre: nombre.trim() }); aviso('Nombre guardado'); }}>Guardar</button>
        </div>
      </Seccion>

      <Seccion n={2} titulo="Apariencia">
        <Selector<Tema> nombre="Apariencia" valor={perfil.tema} alCambiar={(t) => cambiarPerfil({ tema: t })}
          opciones={TEMAS} />
        <div className="mt-3">
          <Selector<Figura> nombre="Estatuas" valor={perfil.figura ?? 'hombre'} alCambiar={(f) => cambiarPerfil({ figura: f })}
            opciones={[{ v: 'hombre', t: 'Legionario' }, { v: 'mujer', t: 'Legionaria' }]} />
        </div>
      </Seccion>

      <Seccion n={3} titulo="Unidades">
        <Selector<Unidad> nombre="Unidades" valor={perfil.unidad} alCambiar={(u) => cambiarPerfil({ unidad: u })}
          opciones={[{ v: 'kg', t: 'Kilos (kg)' }, { v: 'lb', t: 'Libras (lb)' }]} />
      </Seccion>

      <Seccion n={4} titulo="Sobrecarga progresiva">
        <div className="tarjeta">
          <Selector<ModoSobrecarga> nombre="Sobrecarga progresiva" valor={sc.modo}
            alCambiar={(m) => cambiarPerfil({ sobrecarga: { ...sc, modo: m } })}
            opciones={[{ v: 'auto', t: 'Automática' }, { v: 'manual', t: 'Manual' }, { v: 'apagada', t: 'Apagada' }]} />
          <p className="mt-3 text-[13.5px] text-mu">
            {sc.modo === 'auto' ? 'Cuando cumplís todas las repeticiones, la próxima vez la rutina ya arranca con más peso.'
              : sc.modo === 'manual' ? 'Te sugiere cuándo subir y vos decidís si aplicarlo con un toque.'
                : 'No se sugieren cambios de peso.'}
          </p>
          {sc.modo !== 'apagada' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([['superior', 'Tren superior', [1, 1.25, 2.5]], ['inferior', 'Piernas y peso muerto', [2.5, 5]]] as const).map(([k, t, ops]) => (
                <div key={k}>
                  <div className="etiqueta">{t}</div>
                  <div className="mt-2 flex gap-1.5">
                    {ops.map((v) => (
                      <button key={v} className={`chip flex-1 px-1 ${sc[k] === v ? 'chip-on' : ''}`}
                        onClick={() => cambiarPerfil({ sobrecarga: { ...sc, [k]: v } })}>+{formatoNumero(redondear(aUnidad(v, perfil.unidad), 2))}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Seccion>

      <Seccion n={5} titulo="Recordatorios">
        <div className="tarjeta">
          <label className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3 font-semibold"><Icono n="campana" className="oro" />Avisarme para entrenar</span>
            <input type="checkbox" className="h-6 w-6 accent-familia" checked={r.activo}
              onChange={(e) => guardarRecordatorio({ ...r, activo: e.target.checked })} />
          </label>
          {r.activo && (
            <>
              <div className="mt-4 flex items-center gap-3">
                <span className="etiqueta">Hora</span>
                <input type="time" className="campo w-36" value={r.hora} onChange={(e) => guardarRecordatorio({ ...r, hora: e.target.value })} />
              </div>
              <div className="mt-4 flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const on = r.dias.includes(d);
                  return (
                    <button key={d} aria-pressed={on} onClick={() => guardarRecordatorio({ ...r, dias: on ? r.dias.filter((x) => x !== d) : [...r.dias, d] })}
                      className={`chip h-10 flex-1 px-0 text-[12.5px] ${on ? 'chip-on' : ''}`}>
                      {NOMBRES_DIA[d]}
                    </button>
                  );
                })}
              </div>
              {!esNativo() && r.activo && (
                <p className="mt-3 text-[13.5px] text-mu">Los avisos llegan en la app de Android. En la web quedan guardados para cuando la instales.</p>
              )}
            </>
          )}
        </div>
      </Seccion>

      <SeccionPro n={6} />

      <Seccion n={7} titulo="Tus datos">
        <div className="tarjeta py-1">
          <Link to="/conocerte?editar=1" className="fila w-full text-left" data-testid="datos-personales">
            <Icono n="perfil" className="oro" />
            <span className="flex-1"><b>Datos personales</b>
              <span className="block text-[12.5px] text-mu">{[
                perfil.nacimiento ? `${new Date().getFullYear() - Number(perfil.nacimiento.slice(0, 4))} años` : '',
                perfil.altura ? `${perfil.altura} cm` : '',
                perfil.objetivo ? { musculo: 'Ganar músculo', fuerza: 'Ganar fuerza', grasa: 'Perder grasa' }[perfil.objetivo] : '',
                perfil.nivel ? perfil.nivel[0].toUpperCase() + perfil.nivel.slice(1) : '',
              ].filter(Boolean).join(' · ') || 'Género, edad, peso, altura, objetivo y experiencia'}</span></span>
            <Icono n="atras" size={20} className="rotate-180 text-mu" />
          </Link>
          <button className="fila w-full text-left" onClick={exportar}>
            <Icono n="descargar" className="oro" /><span className="flex-1 font-semibold">Exportar mis datos</span>
          </button>
          {repo.modo === 'prueba' && (
            <button className="fila w-full text-left" onClick={() => {
              try { sessionStorage.removeItem('titanus-prueba-datos'); } catch { /* nada */ }
              location.assign('/');
            }}>
              <Icono n="repetir" className="oro" /><span className="flex-1"><b>Volver a los datos de ejemplo</b><span className="block text-[12.5px] text-mu">Borra lo que probaste en esta pestaña</span></span>
            </button>
          )}
          <button className="fila w-full text-left" onClick={() => repo.salir()}>
            <Icono n="salir" className="text-mu" /><span className="flex-1 font-semibold">Cerrar sesión</span>
          </button>
          <button className="fila w-full text-left border-0" onClick={() => setBorrar(true)}>
            <Icono n="basura" className="text-miss" /><span className="flex-1 font-semibold text-miss">Borrar mi cuenta</span>
          </button>
        </div>
      </Seccion>

      {admin && (
        <Seccion n={8} titulo="Versión (solo admin)">
          <button className="tarjeta w-full text-left" onClick={() => setNovedades(true)} data-testid="version">
            <div className="flex items-center justify-between">
              <span className="num text-[20px]">v{VERSION}</span>
              <span className="chip chip-on">Novedades</span>
            </div>
            <div className="mt-2 text-[13.5px] text-mu">
              Armado {new Date(FECHA_ARMADO).toLocaleString('es-PY')} · commit <span className="font-mono">{COMMIT}</span>
            </div>
            <div className="mt-1 text-[13.5px] text-mu">Modo: {repo.modo === 'prueba' ? 'prueba (sin Firebase)' : 'Firebase'}</div>
          </button>
        </Seccion>
      )}

      <p className="mt-6 text-[11px] text-mu2">Fotos de ejercicios: free-exercise-db (dominio público).</p>
      </div>
      </div>
      <Hoja abierta={crear} alCerrar={() => setCrear(false)} titulo="Crear cuenta">
        <FormAcceso inicial="registrar" alTerminar={() => { setCrear(false); aviso('¡Cuenta creada! Tu progreso quedó guardado'); }} />
      </Hoja>

      <Hoja abierta={novedades} alCerrar={() => setNovedades(false)} etiqueta="Novedades" titulo={`Versión ${VERSION}`}>
        {NOVEDADES.map((n) => (
          <div key={n.version} className="mb-5">
            <div className="etiqueta">v{n.version} · {n.fecha}</div>
            <ul className="mt-2 list-disc pl-5 text-[15px] text-tx2 space-y-1">{n.cambios.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        ))}
      </Hoja>

      <Hoja abierta={borrar} alCerrar={() => setBorrar(false)} etiqueta="Borrar cuenta" titulo="¿Borrar todo para siempre?">
        <p className="text-mu">Se borran tu cuenta, tus rutinas, tu historial y tus medidas. No se puede deshacer. Si querés, primero exportá tus datos.</p>
        <label className="block mt-4">
          <span className="etiqueta">Escribí BORRAR para confirmar</span>
          <input className="campo mt-2" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
        </label>
        {error && <p role="alert" className="mt-3 rounded-xl bg-missbg text-miss px-4 py-3 text-[15px]">{error}</p>}
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn btn-peligro" disabled={confirmacion.trim().toUpperCase() !== 'BORRAR'} onClick={borrarCuenta}>Borrar mi cuenta</button>
          <button className="btn-sec" onClick={() => setBorrar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
