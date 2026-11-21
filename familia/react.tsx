import type { MouseEvent, ReactNode } from 'react';
import { Icono } from './iconos';

/**
 * Familia estoica · piezas de React iguales en las 4 apps.
 * Solo usan clases de piezas.css y variables de tokens.css (no dependen de Tailwind).
 */

/** Números romanos (1 → I, 4 → IV…) */
export function romano(n: number): string {
  const tabla: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '';
  let x = Math.max(0, Math.floor(n));
  for (const [v, s] of tabla) while (x >= v) { r += s; x -= v; }
  return r;
}

const HOJAS = [[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]];
const INTERIORES = [[27, 41, 25], [28, 60, 8], [105, 41, -25], [104, 60, -8]];

/** Laurel de la familia. `fondo` = marca de agua grande y tenue (clase .laurel-fondo) */
export function Laurel({ size = 34, fondo = false, className = '' }: { size?: number; fondo?: boolean; className?: string }) {
  return (
    <svg width={size} height={size * 120 / 132} viewBox="0 0 132 120" aria-hidden className={`${fondo ? 'laurel-fondo' : ''} ${className}`}>
      <g fill="none" stroke="var(--gold)" strokeWidth={fondo ? 2 : 3} strokeLinecap="round">
        <path d="M58 108C26 98 12 66 20 24" /><path d="M74 108c32-10 46-42 38-84" />
      </g>
      <g fill="var(--gold)">
        {HOJAS.map(([x, y, g]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4" ry="9.5" transform={`rotate(${g} ${x} ${y})`} />)}
      </g>
    </svg>
  );
}

/** Título de sección: "I · ENTRENAMIENTO DE HOY ————" */
export function Grupo({ n, children, extra, className = '' }: { n?: number; children: ReactNode; extra?: ReactNode; className?: string }) {
  return (
    <div className={`grupo-fila ${className}`}>
      <h2 className="grupo">{n ? <>{romano(n)} · </> : null}{children}</h2>
      <span className="grupo-linea" aria-hidden />
      {extra}
    </div>
  );
}

/** Ficha (chip): texto chico con ícono, borde fino. Con `href` es un enlace y muestra "›" (en las 4 apps igual) */
export function Ficha({ children, className = '', href, ir, testId }: { children: ReactNode; className?: string; href?: string; ir?: (e: MouseEvent<HTMLAnchorElement>, href: string) => void; testId?: string }) {
  if (href) return <a href={href} className={`ficha ${className}`} data-testid={testId} onClick={(e) => ir?.(e, href)}>{children}<span aria-hidden className="ir">›</span></a>;
  return <span className={`ficha ${className}`} data-testid={testId}>{children}</span>;
}

/** Cabecera de página: etiqueta en oro, título grande y una línea */
export function CabeceraPagina({ etiqueta, titulo, linea, accion }: { etiqueta: string; titulo: ReactNode; linea?: ReactNode; accion?: ReactNode }) {
  return (
    <header className="cabecera-pagina">
      <div>
        <div className="grupo">{etiqueta}</div>
        <h1 className="titulo">{titulo}</h1>
        {linea && <p className="cabecera-linea">{linea}</p>}
      </div>
      {accion}
    </header>
  );
}

/**
 * Emblema de la familia: el laurel del ícono con la figura propia de cada app al centro.
 * `figura` = elementos SVG dibujados sobre un lienzo de 512×512 con centro en (256, 245),
 * por ejemplo la mancuerna de StoaGym. Se pintan con el color marfil.
 */
export function Emblema({ size = 28, figura, className = '', testId = 'emblema' }: { size?: number; figura: ReactNode; className?: string; testId?: string }) {
  return (
    <svg width={size} height={size} viewBox="62 100 388 300" aria-hidden className={className} data-testid={testId}>
      <g transform="translate(256 256) scale(1.42) translate(-256 -256)"><g transform="translate(110.8 115) scale(2.2)">
        <g fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M58 108C26 98 12 66 20 24" /><path d="M74 108c32-10 46-42 38-84" /></g>
        <g fill="var(--gold)">
          {HOJAS.map(([x, y, g]) => <ellipse key={`h${x}-${y}`} cx={x} cy={y} rx="4.6" ry="10.5" transform={`rotate(${g} ${x} ${y})`} />)}
          {INTERIORES.map(([x, y, g]) => <ellipse key={`i${x}-${y}`} cx={x} cy={y} rx="3.6" ry="7.6" transform={`rotate(${g} ${x} ${y})`} />)}
        </g>
      </g></g>
      <g style={{ fill: 'var(--marfil)' }}>{figura}</g>
    </svg>
  );
}

/** Una sección de la navegación (sirve igual para la barra lateral y las pestañas) */
export type Seccion = { href: string; icono: string; texto: string; activa: boolean };

/**
 * Barra lateral de PC, igual en las 4 apps: marca (emblema + nombre con brillo), línea dorada,
 * secciones de 46 px con ícono de 22 y, al pie, la persona (avatar de 40 + nombre + detalle).
 * No depende del router: `ir` recibe el clic y la app navega (por ejemplo con preventDefault + navigate).
 */
export function BarraLateral({ emblema, nombreApp, secciones, ir, persona, nota, inicio = '/' }: {
  emblema: ReactNode; nombreApp: string; secciones: Seccion[];
  ir?: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
  persona?: { avatar: ReactNode; nombre: string; detalle?: string; href?: string; testId?: string };
  nota?: ReactNode; inicio?: string;
}) {
  return (
    <aside className="lateral" aria-label="Menú">
      <a href={inicio} className="lateral-marca" data-testid="marca-lateral" onClick={(e) => ir?.(e, inicio)}>{emblema}<span className="marca">{nombreApp}</span></a>
      <div className="divisor" aria-hidden />
      <nav className="lateral-nav">
        {secciones.map((s) => (
          <a key={s.href} href={s.href} className="lateral-item" aria-current={s.activa ? 'page' : undefined} onClick={(e) => ir?.(e, s.href)}>
            <Icono n={s.icono} size={22} />{s.texto}
          </a>
        ))}
      </nav>
      <div className="lateral-pie">
        {persona && (() => {
          const dentro = <><span className="lateral-avatar">{persona.avatar}</span>
            <span style={{ minWidth: 0 }}><span className="lateral-nombre">{persona.nombre}</span>{persona.detalle && <span className="lateral-detalle">{persona.detalle}</span>}</span></>;
          const id = persona.testId ?? 'persona-lateral';
          return persona.href
            ? <a href={persona.href} className="lateral-persona" data-testid={id} onClick={(e) => ir?.(e, persona.href!)}>{dentro}</a>
            : <div className="lateral-persona" data-testid={id}>{dentro}</div>;
        })()}
        {nota && <div className="lateral-nota">{nota}</div>}
      </div>
    </aside>
  );
}

/** Pestañas de abajo en el celular, iguales en las 4 apps (alto 60, ícono 23, texto 11; la activa en oro y negrita) */
export function Pestanas({ secciones, ir }: { secciones: Seccion[]; ir?: (e: MouseEvent<HTMLAnchorElement>, href: string) => void }) {
  return (
    <nav className="pestanas" aria-label="Pestañas">
      <div className="pestanas-fila">
        {secciones.map((s) => (
          <a key={s.href} href={s.href} className="pestana" aria-current={s.activa ? 'page' : undefined} onClick={(e) => ir?.(e, s.href)}>
            <Icono n={s.icono} size={23} />{s.texto}
          </a>
        ))}
      </div>
    </nav>
  );
}

/** Iniciales para el avatar cuando no hay foto: "Lucas Pérez" → "LP" */
export const iniciales = (nombre: string) => nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '·';

/* ——————————————————— v1.3.0: Panel del día, Tu semana, tema y aviso de prueba ——————————————————— */

/** Saludo según la hora (igual en las 4 apps) */
export const saludoDeHora = (t = Date.now()) => { const h = new Date(t).getHours(); return h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
/** "Sábado, 21 de noviembre" */
export const fechaLarga = (t = Date.now()) => { const s = new Intl.DateTimeFormat('es-PY', { weekday: 'long', day: 'numeric', month: 'long' }).format(t); return s.charAt(0).toUpperCase() + s.slice(1); };

/**
 * Panel del día: lo primero de Inicio, igual en las 4 apps.
 * Orden fijo: [avatar] · FECHA (etiqueta oro) · "Buen día, Nombre" · frase estoica del día (de familia/frases.ts) · fichas.
 * Sin niveles ni rangos, y sin emblema (decisión del dueño, v1.5.0). Lo propio de cada app va en `avatar` (por ejemplo,
 * la estatua de StoaGym), en las fichas y en `lado`, que va a la derecha en PC y debajo en el celular (por ejemplo, el anillo de calorías).
 */
export function PanelDia({ nombre, frase, avatar, fichas, lado, ahora = Date.now(), testId = 'panel-dia' }: {
  nombre: string; frase: { texto: string; autor: string }; avatar?: ReactNode; fichas?: ReactNode; lado?: ReactNode; ahora?: number; testId?: string;
}) {
  return (
    <section className="panel-dia" data-testid={testId}>
      <Laurel fondo size={220} />
      <div className="panel-dia-fila">
        <div className="panel-dia-principal">
          <div className="panel-dia-cabeza">
            {avatar && <span className="panel-dia-avatar">{avatar}</span>}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="grupo">{fechaLarga(ahora)}</div>
              <h1 className="panel-dia-saludo">{saludoDeHora(ahora)}, {nombre}</h1>
              <p className="panel-dia-frase" data-testid="frase-del-dia">“{frase.texto}” <span className="panel-dia-autor">— {frase.autor}</span></p>
            </div>
          </div>
          {fichas && <div className="panel-dia-fichas">{fichas}</div>}
        </div>
        {lado && <div className="panel-dia-lado">{lado}</div>}
      </div>
    </section>
  );
}

/** Un día de "Tu semana": fecha AAAA-MM-DD; `hecho` = cumplido; `plan` = planificado (punto dorado) */
export type DiaSemana = { fecha: string; hecho: boolean; hoy: boolean; plan?: boolean };

/** "Tu semana", igual en las 4 apps: día corto, número, ✓ verde si se cumplió, hoy subrayado en oro, "n/7 …" con barra */
export function TuSemana({ dias, texto, extra, nota, testId = 'tu-semana', className = '' }: {
  dias: DiaSemana[]; texto: string; extra?: ReactNode; nota?: ReactNode; testId?: string; className?: string;
}) {
  const hechos = dias.filter((d) => d.hecho).length;
  const corto = (f: string) => new Intl.DateTimeFormat('es-PY', { weekday: 'short' }).format(new Date(`${f}T12:00`)).replace('.', '').slice(0, 3);
  return (
    <div className={`tarjeta tu-semana ${className}`} data-testid={testId}>
      <div className="tu-semana-dias">
        {dias.map((d) => {
          const n = Number(d.fecha.slice(8, 10));
          return (
            <div key={d.fecha} className={`tu-semana-dia${d.hoy ? ' hoy' : ''}${d.hecho ? ' cumplido' : ''}`} aria-label={`${corto(d.fecha)} ${n}: ${d.hecho ? 'cumplido' : 'sin cumplir'}`}>
              <span className="tu-semana-corto">{corto(d.fecha)}</span>
              <span className="num tu-semana-num">{n}</span>
              <span className="tu-semana-marca">{d.hecho ? <Icono n="check" size={16} /> : d.plan ? <span className="tu-semana-plan" /> : null}</span>
            </div>
          );
        })}
      </div>
      <div className="tu-semana-pie">
        <div className="tu-semana-cuenta">
          <span className="num tu-semana-hechos">{hechos}</span><span className="num tu-semana-de">/7</span>
          <span className="tu-semana-texto">{texto}</span>
          {extra && <span className="tu-semana-extra">{extra}</span>}
        </div>
        <div className="tu-semana-barra"><div style={{ width: `${(hechos / 7) * 100}%` }} /></div>
        {nota && <p className="tu-semana-nota">{nota}</p>}
      </div>
    </div>
  );
}

/** Temas de la familia: los mismos nombres y el mismo predeterminado (Noche romana) en las 4 apps */
export type Tema = 'oscuro' | 'claro' | 'sistema';
export const TEMAS: { v: Tema; t: string }[] = [{ v: 'oscuro', t: 'Noche romana' }, { v: 'claro', t: 'Mármol' }, { v: 'sistema', t: 'Sistema' }];
export const TEMA_PREDETERMINADO: Tema = 'oscuro';
/** Pone data-theme en <html> y el color de la barra del teléfono */
export function aplicarTema(t: Tema = TEMA_PREDETERMINADO) {
  const oscuro = t === 'oscuro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = oscuro ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
}
/** Selector de tema (Perfil → Apariencia) */
export function ElegirTema({ valor, cambiar }: { valor: Tema; cambiar: (t: Tema) => void }) {
  return (
    <div className="elegir-tema" role="radiogroup" aria-label="Tema">
      {TEMAS.map((x) => (
        <button key={x.v} type="button" role="radio" aria-checked={valor === x.v} className={`chip${valor === x.v ? ' chip-on' : ''}`} onClick={() => cambiar(x.v)}>{x.t}</button>
      ))}
    </div>
  );
}

/** Aviso de modo prueba, arriba de cada pantalla (igual en las 4 apps) */
export function AvisoPrueba() {
  return <div className="aviso-prueba">Modo prueba · datos inventados</div>;
}
