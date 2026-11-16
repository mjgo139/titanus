import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { aKg, aUnidad, claveDia, formatoNumero, redondear } from '../lib/logica';
import { PLANTILLAS, rutinasDePlantilla } from '../lib/plantillas';
import type { Figura, Nivel, Objetivo, Perfil, Unidad } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { estatuas } from '../ui/estatuas';
import { Icono } from '../ui/Icono';
import { Selector } from '../ui/piezas';

/**
 * Bienvenida "Conocerte": seis preguntas cortas (como Hevy, con la estética de TITANUS).
 * Todo es opcional; se guarda una sola vez al final (1 escritura). También sirve para editar
 * los datos desde Perfil (/conocerte?editar=1).
 */
type Paso = 'genero' | 'nacimiento' | 'peso' | 'altura' | 'objetivo' | 'nivel' | 'plan';
const PASOS: Paso[] = ['genero', 'nacimiento', 'peso', 'altura', 'objetivo', 'nivel', 'plan'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Regla deslizable: se arrastra con el dedo o el mouse, con la rueda, con las flechas, con − / + o escribiendo el número */
function Regla({ valor, min, max, paso, etiqueta, sufijo, alCambiar, formato }: {
  valor: number; min: number; max: number; paso: number; etiqueta: string; sufijo: string;
  alCambiar: (n: number) => void; formato?: (n: number) => string;
}) {
  const PX = 10; // px por paso
  const arrastre = useRef<{ x: number; v: number } | null>(null);
  const ajustar = (n: number) => Math.max(min, Math.min(max, redondear(Math.round((n - min) / paso) * paso + min, 1)));
  const actual = Math.round((valor - min) / paso);
  const total = Math.round((max - min) / paso);
  const desde = Math.max(0, actual - 45);
  const hasta = Math.min(total, actual + 45);
  return (
    <div>
      <div className="flex items-end justify-center gap-2">
        <button aria-label={`Menos ${etiqueta}`} className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-ln3 text-[20px] oro"
          onClick={() => alCambiar(ajustar(valor - paso))}>−</button>
        <label className="flex items-baseline gap-1">
          <input aria-label={etiqueta} type="number" inputMode="decimal" step={paso} min={min} max={max}
            value={valor}
            onChange={(e) => { const n = Number(e.target.value); if (n >= min && n <= max) alCambiar(n); }}
            className={`num w-[170px] bg-transparent text-center text-[64px] leading-none oro outline-none ${formato ? 'hidden' : ''}`} />
          {formato && <span className="num text-[56px] leading-none oro">{formato(valor)}</span>}
          <span className="text-[18px] font-semibold text-mu">{sufijo}</span>
        </label>
        <button aria-label={`Más ${etiqueta}`} className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-ln3 text-[20px] oro"
          onClick={() => alCambiar(ajustar(valor + paso))}>+</button>
      </div>
      <div role="slider" tabIndex={0} aria-label={`Regla de ${etiqueta.toLowerCase()}`} aria-valuemin={min} aria-valuemax={max} aria-valuenow={valor}
        data-testid="regla"
        className="regla relative mt-6 h-[70px] cursor-grab touch-pan-y select-none overflow-hidden outline-none active:cursor-grabbing"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); arrastre.current = { x: e.clientX, v: valor }; }}
        onPointerMove={(e) => {
          const a = arrastre.current; if (!a) return;
          alCambiar(ajustar(a.v - ((e.clientX - a.x) / PX) * paso));
        }}
        onPointerUp={() => { arrastre.current = null; }}
        onPointerCancel={() => { arrastre.current = null; }}
        onWheel={(e) => {
          const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          if (d) alCambiar(ajustar(valor + Math.sign(d) * paso));
        }}
        onKeyDown={(e) => {
          const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
          if (k) { e.preventDefault(); alCambiar(ajustar(valor + k * paso)); }
        }}>
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[3px] -translate-x-1/2 rounded-full" style={{ background: 'var(--oro-grad)' }} />
        <div className="pointer-events-none absolute inset-y-0 left-1/2" style={{ transform: `translateX(${-((valor - min) / paso) * PX}px)` }}>
          {Array.from({ length: hasta - desde + 1 }, (_, j) => {
            const k = desde + j;
            const v = min + k * paso;
            const grande = Math.abs(v - Math.round(v / (paso * 10)) * paso * 10) < 1e-6;
            return (
              <span key={k} className="absolute bottom-0" style={{ left: k * PX }}>
                <span className={`absolute bottom-0 left-0 w-px ${grande ? 'h-8 bg-tx2' : 'h-4 bg-ln3'}`} />
                {grande && <span className="absolute bottom-10 left-0 -translate-x-1/2 whitespace-nowrap text-[12px] text-mu">{formatoNumero(redondear(v, 1))}</span>}
              </span>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-[12px] text-mu">Arrastrá la regla o usá las flechas</p>
    </div>
  );
}

function Opcion({ activo, alElegir, titulo, linea, icono }: { activo: boolean; alElegir: () => void; titulo: string; linea?: string; icono?: ReactNode }) {
  return (
    <button role="radio" aria-checked={activo} onClick={alElegir}
      className={`tarjeta flex w-full items-center gap-4 text-left transition-colors ${activo ? 'border-gold' : 'hover:border-gold2'}`}>
      {icono}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[19px] font-semibold">{titulo}</span>
        {linea && <span className="block text-[13px] text-mu">{linea}</span>}
      </span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${activo ? 'border-gold' : 'border-ln3'}`}>
        {activo && <span className="h-3 w-3 rounded-full" style={{ background: 'var(--oro-grad)' }} />}
      </span>
    </button>
  );
}

export default function Conocerte() {
  const { repo, usuario, perfil, cambiarPerfil, aviso } = useSesion();
  const nav = useNavigate();
  const editar = useSearchParams()[0].get('editar') === '1';
  const [i, setI] = useState(0);
  const [genero, setGenero] = useState<Perfil['genero']>(perfil.genero);
  const [figura, setFigura] = useState<Figura>(perfil.figura ?? 'hombre');
  const hoy = new Date();
  const [nac, setNac] = useState(() => {
    const [a, m, d] = (perfil.nacimiento ?? `${hoy.getFullYear() - 25}-01-01`).split('-').map(Number);
    return { a, m, d };
  });
  const [tocoNac, setTocoNac] = useState(!!perfil.nacimiento);
  const [unidad, setUnidad] = useState<Unidad>(perfil.unidad);
  const [pesoKg, setPesoKg] = useState<number | undefined>();
  const [altura, setAltura] = useState<number | undefined>(perfil.altura);
  const [enPies, setEnPies] = useState(false);
  const [objetivo, setObjetivo] = useState<Objetivo | undefined>(perfil.objetivo);
  const [nivel, setNivel] = useState<Nivel | undefined>(perfil.nivel);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    repo.leerCuerpo(usuario.uid).then((l) => {
      const ult = [...l].sort((a, b) => b.fecha - a.fecha).find((r) => r.peso);
      if (ult?.peso) setPesoKg(ult.peso);
    }).catch(() => undefined);
  }, [repo, usuario.uid]);

  const paso = PASOS[i];
  const edad = useMemo(() => {
    const n = new Date(nac.a, nac.m - 1, nac.d);
    let e = hoy.getFullYear() - n.getFullYear();
    if (hoy < new Date(hoy.getFullYear(), nac.m - 1, nac.d)) e--;
    return e;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nac]);
  const est = estatuas(figura);

  async function terminar(cargarPlantilla = false) {
    setGuardando(true);
    try {
      const c: Partial<Perfil> = { conocido: true, unidad, figura };
      if (genero) c.genero = genero;
      if (tocoNac && edad >= 10 && edad <= 100) c.nacimiento = `${nac.a}-${String(nac.m).padStart(2, '0')}-${String(nac.d).padStart(2, '0')}`;
      if (altura) c.altura = altura;
      if (objetivo) c.objetivo = objetivo;
      if (nivel) c.nivel = nivel;
      await cambiarPerfil(c);
      if (pesoKg) {
        const ahora = Date.now();
        await repo.guardarCuerpo(usuario.uid, { id: claveDia(ahora), fecha: ahora, peso: redondear(pesoKg, 1) });
      }
      if (cargarPlantilla) {
        const actuales = await repo.leerRutinas(usuario.uid);
        for (const r of rutinasDePlantilla(PLANTILLAS[0], actuales.length)) await repo.guardarRutina(usuario.uid, r);
        aviso('Plantilla cargada: tu primer entrenamiento te espera');
        nav('/entreno');
      } else {
        aviso(editar ? 'Datos guardados' : `Bienvenido${figura === 'mujer' ? 'a' : ''} a TITANUS`);
        nav(editar ? '/perfil' : '/');
      }
    } finally { setGuardando(false); }
  }

  const siguiente = () => (i < PASOS.length - 1 ? setI(i + 1) : terminar());
  const atras = () => (i > 0 ? setI(i - 1) : editar ? nav('/perfil') : undefined);

  const titulo: Record<Paso, string> = {
    genero: '¿Cuál es tu género?', nacimiento: '¿Cuándo naciste?', peso: '¿Cuánto pesás?', altura: '¿Cuánto medís?',
    objetivo: '¿Cuál es tu objetivo principal?', nivel: '¿Cuánto tiempo llevás entrenando?', plan: 'Tu camino empieza hoy',
  };
  const anios = Array.from({ length: 90 }, (_, k) => hoy.getFullYear() - 10 - k);
  const diasMes = new Date(nac.a, nac.m, 0).getDate();
  const pies = altura ? `${Math.floor(altura / 30.48)}' ${Math.round((altura % 30.48) / 2.54)}"` : '';

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col px-[17px] pb-6 pt-4" data-testid="conocerte">
      <div className="flex items-center gap-3">
        <button aria-label="Atrás" className={`toque -ml-2 flex items-center justify-center oro ${i === 0 && !editar ? 'invisible' : ''}`} onClick={atras}>
          <Icono n="atras" />
        </button>
        <div className="flex flex-1 gap-1" aria-label={`Paso ${Math.min(i + 1, 6)} de 6`}>
          {PASOS.slice(0, 6).map((p, k) => (
            <span key={p} className="h-1 flex-1 rounded-full transition-colors" style={{ background: k <= i ? 'var(--oro-grad)' : 'var(--ln2)' }} />
          ))}
        </div>
        {paso !== 'plan' && !editar && (
          <button className="text-[14px] font-semibold text-mu hover:text-tx" onClick={() => terminar()} disabled={guardando}>Omitir</button>
        )}
      </div>

      <div key={paso} className="pagina mt-6 flex flex-1 flex-col">
        <div className="etiqueta oro">{paso === 'plan' ? 'Listo' : editar ? 'Tus datos' : 'Conocerte'}</div>
        <h1 className="marca mt-1 text-[30px] leading-tight">{titulo[paso]}</h1>

        <div className="mt-6 flex-1">
          {paso === 'genero' && (
            <div role="radiogroup" aria-label="Género" className="flex flex-col gap-3">
              <Opcion activo={genero === 'hombre'} titulo="Hombre" alElegir={() => { setGenero('hombre'); setFigura('hombre'); }}
                icono={<img src={estatuas('hombre').avatar} alt="" className="h-12 w-12 rounded-full border border-gold2 object-cover" />} />
              <Opcion activo={genero === 'mujer'} titulo="Mujer" alElegir={() => { setGenero('mujer'); setFigura('mujer'); }}
                icono={<img src={estatuas('mujer').avatar} alt="" className="h-12 w-12 rounded-full border border-gold2 object-cover" />} />
              <Opcion activo={genero === 'otro'} titulo="Otro" alElegir={() => setGenero('otro')}
                icono={<span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold2"><Icono n="laurel" className="oro" /></span>} />
              {genero === 'otro' && (
                <div className="tarjeta entrar">
                  <div className="etiqueta mb-2">¿Qué estatuas preferís ver?</div>
                  <Selector<Figura> nombre="Estatuas" valor={figura} alCambiar={setFigura} opciones={[{ v: 'hombre', t: 'Legionario' }, { v: 'mujer', t: 'Legionaria' }]} />
                </div>
              )}
            </div>
          )}

          {paso === 'nacimiento' && (
            <div>
              <div className="grid grid-cols-3 gap-3">
                <label><span className="etiqueta">Día</span>
                  <select aria-label="Día" className="campo mt-2 h-14 text-center num text-[20px]" value={Math.min(nac.d, diasMes)}
                    onChange={(e) => { setNac({ ...nac, d: +e.target.value }); setTocoNac(true); }}>
                    {Array.from({ length: diasMes }, (_, k) => <option key={k} value={k + 1}>{k + 1}</option>)}
                  </select></label>
                <label><span className="etiqueta">Mes</span>
                  <select aria-label="Mes" className="campo mt-2 h-14 text-center text-[18px]" value={nac.m}
                    onChange={(e) => { setNac({ ...nac, m: +e.target.value }); setTocoNac(true); }}>
                    {MESES.map((m, k) => <option key={m} value={k + 1}>{m}</option>)}
                  </select></label>
                <label><span className="etiqueta">Año</span>
                  <select aria-label="Año" className="campo mt-2 h-14 text-center num text-[20px]" value={nac.a}
                    onChange={(e) => { setNac({ ...nac, a: +e.target.value }); setTocoNac(true); }}>
                    {anios.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select></label>
              </div>
              {tocoNac && <p className="mt-6 text-center text-mu">Tenés <b className="num text-[22px] oro">{edad}</b> años</p>}
            </div>
          )}

          {paso === 'peso' && (
            <div>
              <Selector<Unidad> nombre="Unidad de peso" valor={unidad} alCambiar={setUnidad} opciones={[{ v: 'kg', t: 'Kilos' }, { v: 'lb', t: 'Libras' }]} />
              <div className="mt-10">
                <Regla etiqueta="Peso corporal" sufijo={unidad} min={unidad === 'kg' ? 30 : 66} max={unidad === 'kg' ? 250 : 550} paso={0.1}
                  valor={redondear(aUnidad(pesoKg ?? 75, unidad), 1)} alCambiar={(n) => setPesoKg(aKg(n, unidad))} />
              </div>
            </div>
          )}

          {paso === 'altura' && (
            <div>
              <Selector nombre="Unidad de altura" valor={enPies ? 'pies' : 'cm'} alCambiar={(v) => setEnPies(v === 'pies')}
                opciones={[{ v: 'cm', t: 'Centímetros' }, { v: 'pies', t: 'Pies y pulgadas' }]} />
              <div className="mt-10">
                <Regla etiqueta="Altura" sufijo={enPies ? '' : 'cm'} min={120} max={230} paso={1} valor={altura ?? 170} alCambiar={setAltura}
                  formato={enPies ? () => pies || `${Math.floor(170 / 30.48)}' ${Math.round((170 % 30.48) / 2.54)}"` : undefined} />
              </div>
            </div>
          )}

          {paso === 'objetivo' && (
            <div role="radiogroup" aria-label="Objetivo" className="flex flex-col gap-3">
              <Opcion activo={objetivo === 'musculo'} titulo="Ganar músculo" linea="Hipertrofia: más volumen, 8–12 reps" alElegir={() => setObjetivo('musculo')}
                icono={<Icono n="pesa" size={28} className="oro" />} />
              <Opcion activo={objetivo === 'fuerza'} titulo="Ganar fuerza" linea="Pesos altos, 3–6 reps" alElegir={() => setObjetivo('fuerza')}
                icono={<Icono n="medalla" size={28} className="oro" />} />
              <Opcion activo={objetivo === 'grasa'} titulo="Perder grasa" linea="Constancia y más movimiento" alElegir={() => setObjetivo('grasa')}
                icono={<Icono n="fuego" size={28} className="oro" />} />
            </div>
          )}

          {paso === 'nivel' && (
            <div role="radiogroup" aria-label="Experiencia" className="flex flex-col gap-3">
              <Opcion activo={nivel === 'principiante'} titulo="Principiante" linea="Menos de 1 año" alElegir={() => setNivel('principiante')}
                icono={<span className="marca w-8 text-center text-[22px] oro">I</span>} />
              <Opcion activo={nivel === 'intermedio'} titulo="Intermedio" linea="De 1 a 3 años" alElegir={() => setNivel('intermedio')}
                icono={<span className="marca w-8 text-center text-[22px] oro">II</span>} />
              <Opcion activo={nivel === 'avanzado'} titulo="Avanzado" linea="Más de 3 años" alElegir={() => setNivel('avanzado')}
                icono={<span className="marca w-8 text-center text-[22px] oro">III</span>} />
            </div>
          )}

          {paso === 'plan' && (
            <div className="flex flex-col gap-4">
              <div className="hero relative flex min-h-[220px] items-end overflow-hidden p-5 text-left">
                <img src={est.legionario} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" style={{ objectPosition: '50% 15%' }} />
                <div className="relative">
                  <div className="etiqueta oro">{perfil.nombre}</div>
                  <p className="font-display text-[22px] font-semibold">
                    {objetivo === 'fuerza' ? 'La fuerza se forja serie a serie.' : objetivo === 'grasa' ? 'Cada día que entrenás, sumás.' : 'El músculo se construye con constancia.'}
                  </p>
                </div>
              </div>
              {!editar && (nivel === 'principiante' || !nivel) ? (
                <div className="tarjeta">
                  <div className="etiqueta oro">Recomendado para vos</div>
                  <div className="mt-1 font-display text-[20px] font-semibold">{PLANTILLAS[0].nombre}</div>
                  <p className="mt-1 text-[14px] text-mu">3 días por semana (lunes, miércoles y viernes), con los ejercicios básicos y sobrecarga progresiva.</p>
                  <button className="btn mt-4 w-full" disabled={guardando} onClick={() => terminar(true)}><Icono n="play" size={16} />Cargar y empezar</button>
                </div>
              ) : !editar ? (
                <p className="tarjeta text-[14px] text-mu">Armá tus rutinas en Entreno o cargá una plantilla. La sobrecarga progresiva te va a sugerir cuándo subir peso.</p>
              ) : null}
              <p className="text-center text-[13px] text-mu2">Tus datos son privados: solo los ves vos (y tu entrenador, si lo aceptás).</p>
            </div>
          )}
        </div>

        {paso !== 'plan' ? (
          <>
            <p className="mb-3 text-center text-[13px] text-mu2">Tus datos son privados y podés cambiarlos en Perfil.</p>
            <button className="btn h-14 w-full text-[17px]" onClick={siguiente}>Continuar</button>
          </>
        ) : (
          <button className={`${editar || nivel === 'principiante' || !nivel ? 'btn-sec' : 'btn'} mt-4 h-14 w-full text-[16px]`} disabled={guardando} onClick={() => terminar()}>
            {editar ? 'Guardar' : 'Entrar a TITANUS'}
          </button>
        )}
      </div>
    </div>
  );
}
