import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { NOMBRES_DIA, aKg, aUnidad, formatoPeso, nuevoId, redondear } from '../lib/logica';
import type { Ejercicio, EjercicioRutina, Rutina, Unidad } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Hoja, Seccion } from '../ui/piezas';
import { Biblioteca } from './Biblioteca';
import { Miniatura } from './Miniatura';
import { textoObjetivo } from '../lib/plantillas';
import { olvidarDatos } from '../pro/entrenador/Ficha';
import { useEmpezar } from './empezar';

function Paso({ etiqueta, valor, alCambiar, min, max, paso = 1, sufijo = '', vacio = '' }: {
  etiqueta: string; valor: number; alCambiar: (n: number) => void; min: number; max: number; paso?: number; sufijo?: string; vacio?: string;
}) {
  const b = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ln oro disabled:opacity-30';
  return (
    <div className="min-w-0">
      <div className="truncate text-center text-[11px] font-bold uppercase tracking-[.1em] text-mu2">{etiqueta}</div>
      <div className="mt-1 grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-1">
        <button aria-label={`Menos ${etiqueta}`} className={b} disabled={valor <= min} onClick={() => alCambiar(Math.max(min, valor - paso))}>−</button>
        <span className="num truncate text-center text-[16px]">{valor ? `${valor}${sufijo}` : vacio || valor}</span>
        <button aria-label={`Más ${etiqueta}`} className={b} disabled={valor >= max} onClick={() => alCambiar(Math.min(max, valor + paso))}>+</button>
      </div>
    </div>
  );
}

/** Peso planificado: − / + o se escribe directo. Se guarda en kg; se muestra en la unidad del perfil. */
function PasoPeso({ kg, unidad, alCambiar }: { kg: number; unidad: Unidad; alCambiar: (kg: number) => void }) {
  const paso = unidad === 'kg' ? 2.5 : 5;
  const v = kg ? redondear(aUnidad(kg, unidad)) : 0;
  const poner = (x: number) => alCambiar(Math.max(0, aKg(Math.max(0, x), unidad)));
  const b = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ln oro disabled:opacity-30';
  return (
    <div className="min-w-0">
      <div className="truncate text-center text-[11px] font-bold uppercase tracking-[.1em] text-mu2">Peso ({unidad})</div>
      <div className="mt-1 grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-1">
        <button aria-label="Menos peso" className={b} disabled={!v} onClick={() => poner(redondear(v - paso))}>−</button>
        <input aria-label="Peso inicial" type="number" inputMode="decimal" min={0} step={paso} placeholder="—"
          className="num h-9 w-full min-w-0 rounded-[8px] border border-ln2 bg-transparent text-center text-[16px] outline-none focus:border-gold"
          value={v || ''} onChange={(ev) => poner(Number(ev.target.value) || 0)} />
        <button aria-label="Más peso" className={b} onClick={() => poner(redondear(v + paso))}>+</button>
      </div>
    </div>
  );
}

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
  const nueva = id === 'nueva';

  useEffect(() => {
    repo.leerPropios(destino).then(setPropios);
    repo.leerRutinas(destino).then((rs) => {
      const x = rs.find((q) => q.id === id);
      setR(x ?? { id: nuevoId(), nombre: '', dias: [], ejercicios: [], orden: rs.length, creado: Date.now() });
    });
  }, [repo, destino, id]);

  if (!r) return <Cargando />;

  // El cliente ve la rutina que le asignó su entrenador, pero no la cambia
  if (!clienteId && r.asignadaPor) {
    return (
      <div className="lg:mx-auto lg:max-w-[760px]">
        <Encabezado atras="/entreno" etiqueta={`De tu entrenador · ${r.nombreAsignador ?? ''}`} titulo={r.nombre}
          linea="La cambia tu entrenador. Al entrenar podés ajustar el peso y las reps de cada serie." />
        <div className="tarjeta flex items-center gap-2 text-[14px] text-mu" data-testid="rutina-solo-lectura">
          <Icono n="escudo" size={18} className="oro shrink-0" />{r.dias.length ? r.dias.map((d) => NOMBRES_DIA[d]).join(' · ') : 'Sin día fijo'}
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {r.ejercicios.map((e, i) => (
            <li key={i} className="tarjeta flex items-center gap-3 py-3">
              <Miniatura musculo={buscarEjercicio(e.ejercicioId, propios)?.musculo} id={e.ejercicioId} tam={40} />
              <span className="min-w-0 flex-1"><b className="block truncate oro">{buscarEjercicio(e.ejercicioId, propios)?.nombre ?? 'Ejercicio'}</b>
                {e.nota && <span className="text-[12px] text-mu">{e.nota}</span>}</span>
              <span className="num shrink-0 text-right text-tx2">{textoObjetivo(e)}{e.peso ? <span className="block text-[12px] oro">{formatoPeso(e.peso, perfil.unidad)}</span> : null}</span>
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

      <Seccion titulo="Días">
        <div className="flex justify-between gap-1">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const on = r.dias.includes(d);
            return (
              <button key={d} aria-pressed={on} onClick={() => setR({ ...r, dias: on ? r.dias.filter((x) => x !== d) : [...r.dias, d].sort() })}
                className={`chip h-11 flex-1 px-0 text-[13px] ${on ? 'chip-on' : ''}`}>
                {NOMBRES_DIA[d]}
              </button>
            );
          })}
        </div>
      </Seccion>

      <Seccion titulo={`Ejercicios · ${r.ejercicios.length}`}>
        <ul className="flex flex-col gap-3">
          {r.ejercicios.map((e, i) => (
            <li key={e.ejercicioId} className="tarjeta">
              <div className="flex items-center gap-2">
                <Miniatura musculo={buscarEjercicio(e.ejercicioId, propios)?.musculo} id={e.ejercicioId} tam={38} />
                <span className="flex-1 font-semibold oro">{buscarEjercicio(e.ejercicioId, propios)?.nombre ?? 'Ejercicio'}</span>
                <button aria-label="Subir" className="h-8 w-8 flex items-center justify-center text-mu" onClick={() => mover(i, -1)}><Icono n="arriba" size={18} /></button>
                <button aria-label="Bajar" className="h-8 w-8 flex items-center justify-center text-mu" onClick={() => mover(i, 1)}><Icono n="abajo" size={18} /></button>
                <button aria-label="Quitar" className="h-8 w-8 flex items-center justify-center text-miss"
                  onClick={() => setR({ ...r, ejercicios: r.ejercicios.filter((_, j) => j !== i) })}><Icono n="basura" size={18} /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <PasoPeso kg={e.peso ?? 0} unidad={perfil.unidad} alCambiar={(kg) => cambiarEj(i, { peso: kg || undefined })} />
                <Paso etiqueta="Series" valor={e.series} min={1} max={10} alCambiar={(n) => cambiarEj(i, { series: n })} />
                <Paso etiqueta="Reps" valor={e.reps} min={1} max={50} alCambiar={(n) => cambiarEj(i, { reps: n, ...(e.repsMax && e.repsMax <= n ? { repsMax: 0 } : {}) })} />
                <Paso etiqueta="Reps máx" vacio="—" valor={e.repsMax ?? 0} min={0} max={50} alCambiar={(n) => {
                  const actual = e.repsMax ?? 0;
                  const sube = n > actual;
                  cambiarEj(i, { repsMax: sube ? Math.max(n, e.reps + 1) : n > e.reps ? n : 0 });
                }} />
                <Paso etiqueta="Al fallo" vacio="—" valor={e.alFallo ?? 0} min={0} max={3} alCambiar={(n) => cambiarEj(i, { alFallo: n })} />
                <Paso etiqueta="Descanso" valor={e.descanso} min={15} max={300} paso={15} sufijo="s" alCambiar={(n) => cambiarEj(i, { descanso: n })} />
              </div>
              <div className="mt-3 text-[14px] font-semibold oro" data-testid="resumen-ejercicio">
                {textoObjetivo(e)}{e.peso ? ` · ${formatoPeso(e.peso, perfil.unidad)}` : ''}
              </div>
              <input className="mt-2 h-10 w-full rounded-[8px] border border-ln2 bg-transparent px-3 text-[14px] outline-none focus:border-gold" placeholder="Alternativa o nota (opcional)"
                aria-label="Alternativa" value={e.nota ?? ''} onChange={(ev) => cambiarEj(i, { nota: ev.target.value })} />
            </li>
          ))}
        </ul>
        <button className="btn-sec w-full mt-3" onClick={() => setBiblio(true)}><Icono n="mas" size={16} />Agregar ejercicio</button>
      </Seccion>

      <div className="mt-8 flex flex-col gap-3">
        <button className="btn" onClick={guardar}>{clienteId ? 'Guardar y asignar' : 'Guardar rutina'}</button>
        {!nueva && <button className="btn-sec text-miss" onClick={() => setConfirmar(true)}>Borrar rutina</button>}
      </div>

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
          <button className="btn" style={{ background: 'var(--miss)', borderColor: 'var(--miss)', color: '#fff' }} onClick={borrar}>Sí, borrar</button>
          <button className="btn-sec" onClick={() => setConfirmar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
