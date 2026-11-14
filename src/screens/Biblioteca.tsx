import { useMemo, useState } from 'react';
import { BIBLIOTECA, MUSCULOS, normalizar } from '../lib/biblioteca';
import { nuevoId } from '../lib/logica';
import type { Ejercicio, Musculo } from '../lib/tipos';
import { Icono } from '../ui/Icono';
import { Hoja } from '../ui/piezas';
import { Miniatura } from './Miniatura';

export function Biblioteca({ abierta, alCerrar, propios, elegidos, alElegir, alCrear }: {
  abierta: boolean;
  alCerrar: () => void;
  propios: Ejercicio[];
  elegidos: string[];
  alElegir: (e: Ejercicio) => void;
  alCrear: (e: Ejercicio) => Promise<void>;
}) {
  const [texto, setTexto] = useState('');
  const [musculo, setMusculo] = useState<Musculo | 'Todos'>('Todos');
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [mNuevo, setMNuevo] = useState<Musculo>('Pecho');

  const lista = useMemo(() => {
    const t = normalizar(texto.trim());
    return [...propios, ...BIBLIOTECA].filter((e) =>
      (musculo === 'Todos' || e.musculo === musculo) && (!t || normalizar(e.nombre).includes(t)));
  }, [texto, musculo, propios]);

  const grupos = MUSCULOS.map((m) => ({ m, items: lista.filter((e) => e.musculo === m) })).filter((g) => g.items.length);

  async function crear() {
    if (!nombre.trim()) return;
    const e: Ejercicio = { id: 'p-' + nuevoId(), nombre: nombre.trim(), musculo: mNuevo, propio: true };
    await alCrear(e);
    alElegir(e);
    setNombre(''); setCreando(false);
  }

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} etiqueta="Ejercicios" titulo="Elegí qué entrenar">
      {creando ? (
        <div className="flex flex-col gap-4">
          <label>
            <span className="etiqueta">Nombre del ejercicio</span>
            <input className="campo mt-2" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Ej.: Remo en T" />
          </label>
          <div>
            <span className="etiqueta">Músculo</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {MUSCULOS.map((m) => (
                <button key={m} onClick={() => setMNuevo(m)} className={`chip ${mNuevo === m ? 'chip-on' : ''}`}>{m}</button>
              ))}
            </div>
          </div>
          <button className="btn" onClick={crear} disabled={!nombre.trim()}>Guardar ejercicio</button>
          <button className="btn-sec" onClick={() => setCreando(false)}>Volver a la lista</button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Icono n="buscar" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mu" />
            <input className="campo pl-10" placeholder="Buscar ejercicio" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar ejercicio" />
          </div>
          <div className="mt-3 -mx-5 px-5 flex gap-2 overflow-x-auto pb-1">
            {(['Todos', ...MUSCULOS] as const).map((m) => (
              <button key={m} onClick={() => setMusculo(m)} className={`chip shrink-0 ${musculo === m ? 'chip-on' : ''}`}>{m}</button>
            ))}
          </div>
          <button onClick={() => setCreando(true)} className="btn-sec w-full mt-4"><Icono n="mas" size={16} />Crear ejercicio propio</button>
          <div className="mt-2">
            {grupos.map((g) => (
              <div key={g.m} className="mt-4">
                <div className="etiqueta mb-1">{g.m}</div>
                {g.items.map((e) => {
                  const ya = elegidos.includes(e.id);
                  return (
                    <button key={e.id} disabled={ya} onClick={() => alElegir(e)} className="fila w-full text-left disabled:opacity-50">
                      <Miniatura musculo={e.musculo} id={e.id} tam={42} />
                      <span className="flex-1">
                        <span className="block font-semibold text-tx">{e.nombre}</span>
                        <span className="text-[12px] text-mu">{e.propio ? 'Propio' : e.equipo}</span>
                      </span>
                      <span className="oro">{ya ? <Icono n="check" size={18} /> : <Icono n="mas" size={18} />}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {!grupos.length && <p className="py-8 text-center text-mu">No encontramos ese ejercicio. Podés crearlo como propio.</p>}
          </div>
        </>
      )}
    </Hoja>
  );
}
