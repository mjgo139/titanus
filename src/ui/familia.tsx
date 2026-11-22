import { Emblema as EmblemaFamilia } from '../../familia/react';

/**
 * Piezas de la familia estoica: vienen de la carpeta familia/ (copia del repo mjgo139/familia-estoica).
 * Acá solo se agrega lo propio de StoaGym: la mancuerna del emblema.
 */
export { Laurel, Grupo, Ficha, CabeceraPagina, BarraLateral, Pestanas, iniciales,
  PanelDia, TuSemana, ElegirTema, AvisoPrueba, aplicarTema, saludoDeHora, fechaLarga, TEMAS, TEMA_PREDETERMINADO,
  Avatar, BotonFoto, TarjetaPerfil, prepararFoto, PortadaAcceso, PantallaAcceso, FormularioAcceso, type VistaAcceso, DescargarApp } from '../../familia/react';

/** Mancuerna de StoaGym (lienzo 512, centro 256,245) */
const MANCUERNA = (
  <g transform="translate(256 245) scale(.5)">
    <rect x="-75" y="-15" width="150" height="30" rx="8" /><rect x="-113" y="-82" width="42" height="164" rx="16" /><rect x="71" y="-82" width="42" height="164" rx="16" />
    <rect x="-155" y="-58" width="34" height="116" rx="14" /><rect x="121" y="-58" width="34" height="116" rx="14" />
    <rect x="-177" y="-20" width="22" height="40" rx="8" /><rect x="155" y="-20" width="22" height="40" rx="8" />
  </g>
);

/** Emblema de StoaGym: el laurel de la familia con la mancuerna marfil (igual al ícono de la app) */
export function Emblema({ size = 28, className = '' }: { size?: number; className?: string }) {
  return <EmblemaFamilia size={size} className={className} figura={MANCUERNA} />;
}
