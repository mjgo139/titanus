import { useState } from 'react';
import { mensajeError } from '../data/repo';
import { NOMBRES_DIA } from '../lib/logica';
import { COMMIT, FECHA_ARMADO, NOVEDADES, VERSION } from '../lib/novedades';
import { esNativo, programarRecordatorios } from '../lib/recordatorios';
import type { Recordatorio, Tema, Unidad } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Encabezado, Hoja, Seccion, Selector } from '../ui/piezas';

export default function Perfil() {
  const { repo, usuario, perfil, admin, cambiarPerfil, aviso } = useSesion();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [borrar, setBorrar] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [novedades, setNovedades] = useState(false);
  const r = perfil.recordatorio;

  async function guardarRecordatorio(n: Recordatorio) {
    await cambiarPerfil({ recordatorio: n });
    const res = await programarRecordatorios(n);
    if (res === 'sin-permiso') aviso('Activá las notificaciones de TITANUS en tu teléfono');
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
      <Encabezado etiqueta="Perfil" titulo="Tus ajustes" linea={usuario.email} />

      <Seccion titulo="Nombre">
        <div className="flex gap-2">
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre" />
          <button className="btn-sec h-[46px] shrink-0" disabled={!nombre.trim() || nombre === perfil.nombre}
            onClick={async () => { await cambiarPerfil({ nombre: nombre.trim() }); aviso('Nombre guardado'); }}>Guardar</button>
        </div>
      </Seccion>

      <Seccion titulo="Apariencia">
        <Selector<Tema> nombre="Apariencia" valor={perfil.tema} alCambiar={(t) => cambiarPerfil({ tema: t })}
          opciones={[{ v: 'claro', t: 'Claro' }, { v: 'oscuro', t: 'Oscuro' }, { v: 'sistema', t: 'Sistema' }]} />
      </Seccion>

      <Seccion titulo="Unidades">
        <Selector<Unidad> nombre="Unidades" valor={perfil.unidad} alCambiar={(u) => cambiarPerfil({ unidad: u })}
          opciones={[{ v: 'kg', t: 'Kilos (kg)' }, { v: 'lb', t: 'Libras (lb)' }]} />
      </Seccion>

      <Seccion titulo="Recordatorios">
        <div className="tarjeta">
          <label className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3 font-semibold"><Icono n="campana" className="text-gold" />Avisarme para entrenar</span>
            <input type="checkbox" className="h-6 w-6 accent-[var(--gold)]" checked={r.activo}
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
                      className={`h-10 flex-1 rounded-full border text-[12px] font-bold ${on ? 'border-gold bg-goldbg text-gold' : 'border-ln text-mu'}`}>
                      {NOMBRES_DIA[d]}
                    </button>
                  );
                })}
              </div>
              {!esNativo() && (
                <p className="mt-3 text-[13px] text-mu">Los avisos llegan en la app de Android. En la web quedan guardados para cuando la instales.</p>
              )}
            </>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Tus datos">
        <div className="tarjeta py-1">
          <button className="fila w-full text-left" onClick={exportar}>
            <Icono n="descargar" className="text-gold" /><span className="flex-1 font-semibold">Exportar mis datos</span>
          </button>
          <button className="fila w-full text-left" onClick={() => repo.salir()}>
            <Icono n="salir" className="text-mu" /><span className="flex-1 font-semibold">Salir</span>
          </button>
          <button className="fila w-full text-left border-0" onClick={() => setBorrar(true)}>
            <Icono n="basura" className="text-miss" /><span className="flex-1 font-semibold text-miss">Borrar mi cuenta</span>
          </button>
        </div>
      </Seccion>

      {admin && (
        <Seccion titulo="Versión (solo admin)">
          <button className="tarjeta w-full text-left" onClick={() => setNovedades(true)} data-testid="version">
            <div className="flex items-center justify-between">
              <span className="num text-[22px]">v{VERSION}</span>
              <span className="chip">Novedades</span>
            </div>
            <div className="mt-2 text-[13px] text-mu">
              Armado {new Date(FECHA_ARMADO).toLocaleString('es-PY')} · commit <span className="font-mono">{COMMIT}</span>
            </div>
            <div className="mt-1 text-[13px] text-mu">Modo: {repo.modo === 'prueba' ? 'prueba (sin Firebase)' : 'Firebase'}</div>
          </button>
        </Seccion>
      )}

      <Hoja abierta={novedades} alCerrar={() => setNovedades(false)} etiqueta="Novedades" titulo={`Versión ${VERSION}`}>
        {NOVEDADES.map((n) => (
          <div key={n.version} className="mb-5">
            <div className="etiqueta">v{n.version} · {n.fecha}</div>
            <ul className="mt-2 list-disc pl-5 text-[14px] text-tx2 space-y-1">{n.cambios.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        ))}
      </Hoja>

      <Hoja abierta={borrar} alCerrar={() => setBorrar(false)} etiqueta="Borrar cuenta" titulo="¿Borrar todo para siempre?">
        <p className="text-mu">Se borran tu cuenta, tus rutinas, tu historial y tus medidas. No se puede deshacer. Si querés, primero exportá tus datos.</p>
        <label className="block mt-4">
          <span className="etiqueta">Escribí BORRAR para confirmar</span>
          <input className="campo mt-2" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
        </label>
        {error && <p role="alert" className="mt-3 rounded-xl bg-missbg text-miss px-4 py-3 text-[14px]">{error}</p>}
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn bg-miss" disabled={confirmacion.trim().toUpperCase() !== 'BORRAR'} onClick={borrarCuenta}>Borrar mi cuenta</button>
          <button className="btn-sec" onClick={() => setBorrar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
