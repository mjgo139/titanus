import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { NOMBRES_DIA, formatoPeso, nuevoId } from '../lib/logica';
import type { Ejercicio, EjercicioRutina, Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Hoja, Seccion } from '../ui/piezas';
import { Biblioteca } from './Biblioteca';
import { Miniatura } from './Miniatura';
import { conFilas, filasDeRutina, textoObjetivo } from '../lib/plantillas';
import { TarjetaEjercicio, textoDescanso } from './TarjetaEjercicio';
import { olvidarDatos } from '../pro/entrenador/Ficha';
import { useEmpezar } from './empezar';

export default function EditarRutina() {
  // Con :uid es el entrenador armando la rutina de su cliente
  const { id = 'nueva', uid: clienteId } = useParams();
  const { repo, usuario, perfil, aviso } = useSesion();
  const empezar = useEmpezar();
  const destino = clienteId ?? usuario.uid;
  const volver = clienteId ? `/clientes/${clienteId}?ver=rutinas` : '/entreno';
  const nav = useNavigate();
  const [r, setR] = useState<Rutina | null>(null);
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [biblio, setBiblio] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [descanso, setDescanso] = useState<number | null>(null);
  const nueva = id === 'nueva';

  useEffect(() => {
    repo.leerPropios(destino).then(setPropios);
    repo.leerRutinas(destino).then((rs) => {
      const x = rs.find((q) => q.id === id);
      setR(x ?? { id: nuevoId(), nombre: '', dias: [], ejercicios: [], orden: rs.length, creado: Date.now() });
    });
  }, [repo, destino, id]);

  if (!r) return <Cargando forma="pagina" />;

  // El cliente ve la rutina que le asignó su entrenador, pero no la cambia
  if (!clienteId && r.asignadaPor) {
    return (
      <div className="lg:mx-auto lg:max-w-[760px]">
        <Encabezado atras="/entreno" etiqueta={`De tu entrenador · ${r.nombreAsignador ?? ''}`} titulo={r.nombre}
          linea="La cambia tu entrenador. Al entrenar podés ajustar el peso y las reps de cada serie." />
        <div className="tarjeta flex items-center gap-2 text-[13.5px] text-mu" data-testid="rutina-solo-lectura">
          <Icono n="escudo" size={20} className="oro shrink-0" />{r.dias.length ? r.dias.map((d) => NOMBRES_DIA[d]).join(' · ') : 'Sin día fijo'}
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {r.ejercicios.map((e, i) => (
            <li key={i} className="tarjeta flex items-center gap-3 py-3">
              <Miniatura musculo={buscarEjercicio(e.ejercicioId, propios)?.musculo} id={e.ejercicioId} tam={40} />
              <span className="min-w-0 flex-1"><b className="block truncate oro">{buscarEjercicio(e.ejercicioId, propios)?.nombre ?? 'Ejercicio'}</b>
                {e.nota && <span className="text-[12.5px] text-mu">{e.nota}</span>}</span>
              <span className="num shrink-0 text-right text-tx2">{textoObjetivo(e)}{e.peso ? <span className="block text-[12.5px] oro">{formatoPeso(e.peso, perfil.unidad)}</span> : null}</span>
            </li>
          ))}
        </ul>
        <button className="btn mt-6 w-full" disabled={!r.ejercicios.length} onClick={() => empezar.rutina(r)}><Icono n="play" size={16} />Empezar rutina</button>
      </div>
    );
  }

  const cambiarEj = (i: number, c: Partial<EjercicioRutina>) =>
    setR({ ...r, ejercicios: r.ejercicios.map((e, j) => (j === i ? { ...e, ...c } : e)) });
  const mover = (i: number, d: -1 | 1) => {
    const l = [...r.ejercicios];
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    setR({ ...r, ejercicios: l });
  };

  async function guardar() {
    if (!r) return;
    const final: Rutina = { ...r, nombre: r.nombre.trim() || 'Mi rutina', ...(clienteId ? { asignadaPor: usuario.uid, nombreAsignador: perfil.nombre } : {}) };
    await repo.guardarRutina(destino, final);
    if (clienteId) olvidarDatos(clienteId);
    aviso(clienteId ? 'Rutina asignada' : 'Rutina guardada');
    nav(volver);
  }

  async function borrar() {
    if (!r) return;
    await repo.borrarRutina(destino, r.id);
    if (clienteId) olvidarDatos(clienteId);
    aviso('Rutina borrada');
    nav(volver);
  }

  return (
    <div className="lg:mx-auto lg:max-w-[760px]">
      <Encabezado atras={volver} etiqueta={clienteId ? (nueva ? 'Rutina para tu cliente' : 'Rutina de tu cliente') : nueva ? 'Rutina nueva' : 'Editar rutina'} titulo={r.nombre || 'Sin nombre'}
        linea="Nombre, días y ejercicios con sus series." />

      <label className="block">
        <span className="etiqueta">Nombre</span>
        <input className="campo mt-2" value={r.nombre} placeholder="Ej.: Pecho y tríceps"
          onChange={(e) => setR({ ...r, nombre: e.target.value })} />
      </label>

      <Seccion n={1} titulo="Días">
        <div className="flex justify-between gap-1">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const on = r.dias.includes(d);
            return (
              <button key={d} aria-pressed={on} onClick={() => setR({ ...r, dias: on ? r.dias.filter((x) => x !== d) : [...r.dias, d].sort() })}
                className={`chip h-11 flex-1 px-0 text-[13.5px] ${on ? 'chip-on' : ''}`}>
                {NOMBRES_DIA[d]}
              </button>
            );
          })}
        </div>
      </Seccion>

      <Seccion n={2} titulo={`Ejercicios · ${r.ejercicios.length}`}>
        <ul className="flex flex-col gap-3">
          {r.ejercicios.map((e, i) => (
            <TarjetaEjercicio key={e.ejercicioId + i} i={i} total={r.ejercicios.length} ejercicioId={e.ejercicioId} propios={propios}
              subtitulo={textoObjetivo(e)} series={filasDeRutina(e)} unidad={perfil.unidad} descanso={textoDescanso(e.descanso)}
              alSeries={(filas) => setR((x) => x && ({ ...x, ejercicios: x.ejercicios.map((y, k) => (k === i ? conFilas(y, filas) : y)) }))}
              nueva={(u) => ({ tipo: 'normal' as const, peso: u?.peso ?? 0, reps: u?.reps || e.reps || 10 })}
              alDescanso={() => setDescanso(i)} alMover={(d) => mover(i, d)}
              alEliminar={() => setR({ ...r, ejercicios: r.ejercicios.filter((_, j) => j !== i) })}
              extra={(
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <input className="h-10 w-full min-w-0 rounded-[8px] border border-ln2 bg-transparent px-3 text-[15px] outline-none focus:border-gold"
                    placeholder="Alternativa o nota (opcional)" aria-label="Alternativa" value={e.nota ?? ''}
                    onChange={(ev) => cambiarEj(i, { nota: ev.target.value })} />
                  <label className="flex items-center gap-1 text-[12.5px] text-mu" title="Rango de repeticiones para la sobrecarga progresiva">
                    hasta
                    <input type="number" inputMode="numeric" min={0} aria-label="Reps máximas del rango" placeholder="—"
                      className="num h-10 w-12 rounded-[8px] border border-ln2 bg-transparent text-center text-[15px] outline-none focus:border-gold"
                      value={e.repsMax || ''} onChange={(ev) => { const n = Math.round(Number(ev.target.value) || 0); cambiarEj(i, { repsMax: n > e.reps ? n : undefined }); }} />
                    reps
                  </label>
                </div>
              )} />
          ))}
        </ul>
        <button className="btn-sec w-full mt-3" onClick={() => setBiblio(true)}><Icono n="mas" size={16} />Agregar ejercicio</button>
      </Seccion>

      <div className="mt-8 flex flex-col gap-3">
        <button className="btn" onClick={guardar}>{clienteId ? 'Guardar y asignar' : 'Guardar rutina'}</button>
        {!nueva && <button className="btn-sec text-miss" onClick={() => setConfirmar(true)}>Borrar rutina</button>}
      </div>

      <Hoja abierta={descanso !== null} alCerrar={() => setDescanso(null)} etiqueta="Descanso"
        titulo={descanso !== null ? buscarEjercicio(r.ejercicios[descanso]?.ejercicioId ?? '', propios)?.nombre ?? '' : ''}>
        <div className="flex flex-wrap gap-2">
          {[30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((d) => (
            <button key={d} className={`chip ${descanso !== null && r.ejercicios[descanso]?.descanso === d ? 'chip-on' : ''}`}
              onClick={() => { cambiarEj(descanso!, { descanso: d }); setDescanso(null); }}>{textoDescanso(d)}</button>
          ))}
        </div>
      </Hoja>

      <Biblioteca abierta={biblio} alCerrar={() => setBiblio(false)} propios={propios}
        elegidos={r.ejercicios.map((e) => e.ejercicioId)}
        alElegir={(e) => {
          setR((x) => x && ({ ...x, ejercicios: [...x.ejercicios, { ejercicioId: e.id, series: 3, reps: 10, descanso: e.musculo === 'Cardio' ? 60 : 90 }] }));
          setBiblio(false);
        }}
        alCrear={async (e) => {
          await repo.guardarPropio(destino, e);
          setPropios((p) => [...p, e]);
        }} />

      <Hoja abierta={confirmar} alCerrar={() => setConfirmar(false)} etiqueta="Confirmar" titulo="¿Borrar esta rutina?">
        <p className="text-mu">Tu historial de entrenamientos no se borra.</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn btn-peligro" onClick={borrar}>Sí, borrar</button>
          <button className="btn-sec" onClick={() => setConfirmar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
