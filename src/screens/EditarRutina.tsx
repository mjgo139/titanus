import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { NOMBRES_DIA, nuevoId } from '../lib/logica';
import type { Ejercicio, EjercicioRutina, Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Hoja, Seccion } from '../ui/piezas';
import { Biblioteca } from './Biblioteca';
import { Miniatura } from './Miniatura';
import { textoObjetivo } from '../lib/plantillas';

function Paso({ etiqueta, valor, alCambiar, min, max, paso = 1, sufijo = '' }: {
  etiqueta: string; valor: number; alCambiar: (n: number) => void; min: number; max: number; paso?: number; sufijo?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[11px] font-bold uppercase tracking-[.1em] text-mu2">{etiqueta}</span>
      <div className="mt-1 flex items-center gap-1">
        <button aria-label={`Menos ${etiqueta}`} className="h-8 w-8 rounded-full border border-ln oro" onClick={() => alCambiar(Math.max(min, valor - paso))}>−</button>
        <span className="num w-12 text-center text-[16px]">{valor || (etiqueta === 'Hasta' || etiqueta === 'Al fallo' ? '—' : valor)}{valor ? sufijo : ''}</span>
        <button aria-label={`Más ${etiqueta}`} className="h-8 w-8 rounded-full border border-ln oro" onClick={() => alCambiar(Math.min(max, valor + paso))}>+</button>
      </div>
    </div>
  );
}

export default function EditarRutina() {
  const { id = 'nueva' } = useParams();
  const { repo, usuario, aviso } = useSesion();
  const nav = useNavigate();
  const [r, setR] = useState<Rutina | null>(null);
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [biblio, setBiblio] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const nueva = id === 'nueva';

  useEffect(() => {
    repo.leerPropios(usuario.uid).then(setPropios);
    repo.leerRutinas(usuario.uid).then((rs) => {
      const x = rs.find((q) => q.id === id);
      setR(x ?? { id: nuevoId(), nombre: '', dias: [], ejercicios: [], orden: rs.length, creado: Date.now() });
    });
  }, [repo, usuario.uid, id]);

  if (!r) return <Cargando />;

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
    const final = { ...r, nombre: r.nombre.trim() || 'Mi rutina' };
    await repo.guardarRutina(usuario.uid, final);
    aviso('Rutina guardada');
    nav('/entreno');
  }

  async function borrar() {
    if (!r) return;
    await repo.borrarRutina(usuario.uid, r.id);
    aviso('Rutina borrada');
    nav('/entreno');
  }

  return (
    <div className="lg:mx-auto lg:max-w-[760px]">
      <Encabezado atras="/entreno" etiqueta={nueva ? 'Rutina nueva' : 'Editar rutina'} titulo={r.nombre || 'Sin nombre'}
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
                <Miniatura musculo={buscarEjercicio(e.ejercicioId, propios)?.musculo} tam={34} />
                <span className="flex-1 font-semibold oro">{buscarEjercicio(e.ejercicioId, propios)?.nombre ?? 'Ejercicio'}</span>
                <button aria-label="Subir" className="h-8 w-8 flex items-center justify-center text-mu" onClick={() => mover(i, -1)}><Icono n="arriba" size={18} /></button>
                <button aria-label="Bajar" className="h-8 w-8 flex items-center justify-center text-mu" onClick={() => mover(i, 1)}><Icono n="abajo" size={18} /></button>
                <button aria-label="Quitar" className="h-8 w-8 flex items-center justify-center text-miss"
                  onClick={() => setR({ ...r, ejercicios: r.ejercicios.filter((_, j) => j !== i) })}><Icono n="basura" size={18} /></button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-y-3">
                <Paso etiqueta="Series" valor={e.series} min={1} max={10} alCambiar={(n) => cambiarEj(i, { series: n })} />
                <Paso etiqueta="Reps" valor={e.reps} min={1} max={50} alCambiar={(n) => cambiarEj(i, { reps: n, ...(e.repsMax && e.repsMax <= n ? { repsMax: 0 } : {}) })} />
                <Paso etiqueta="Hasta" valor={e.repsMax ?? 0} min={0} max={50} alCambiar={(n) => {
                  const actual = e.repsMax ?? 0;
                  const sube = n > actual;
                  cambiarEj(i, { repsMax: sube ? Math.max(n, e.reps + 1) : n > e.reps ? n : 0 });
                }} />
                <Paso etiqueta="Al fallo" valor={e.alFallo ?? 0} min={0} max={3} alCambiar={(n) => cambiarEj(i, { alFallo: n })} />
                <Paso etiqueta="Descanso" valor={e.descanso} min={15} max={300} paso={15} sufijo="s" alCambiar={(n) => cambiarEj(i, { descanso: n })} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[13px]">
                <span className="oro font-semibold">{textoObjetivo(e)}</span>
                <input className="h-8 flex-1 rounded-[8px] border border-ln2 bg-transparent px-2 text-right outline-none" placeholder="Alternativa (opcional)"
                  aria-label="Alternativa" value={e.nota ?? ''} onChange={(ev) => cambiarEj(i, { nota: ev.target.value })} />
              </div>
            </li>
          ))}
        </ul>
        <button className="btn-sec w-full mt-3" onClick={() => setBiblio(true)}><Icono n="mas" size={16} />Agregar ejercicio</button>
      </Seccion>

      <div className="mt-8 flex flex-col gap-3">
        <button className="btn" onClick={guardar}>Guardar rutina</button>
        {!nueva && <button className="btn-sec text-miss" onClick={() => setConfirmar(true)}>Borrar rutina</button>}
      </div>

      <Biblioteca abierta={biblio} alCerrar={() => setBiblio(false)} propios={propios}
        elegidos={r.ejercicios.map((e) => e.ejercicioId)}
        alElegir={(e) => {
          setR((x) => x && ({ ...x, ejercicios: [...x.ejercicios, { ejercicioId: e.id, series: 3, reps: 10, descanso: e.musculo === 'Cardio' ? 60 : 90 }] }));
          setBiblio(false);
        }}
        alCrear={async (e) => {
          await repo.guardarPropio(usuario.uid, e);
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
