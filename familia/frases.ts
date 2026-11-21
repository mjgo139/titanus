/**
 * Familia estoica · frases del día (traducciones libres de textos clásicos, dominio público).
 * Una sola lista para las 4 apps. Cada app pide su tema y recibe una frase de ese tema o una general:
 *   StoaGym → 'esfuerzo' · StoaFit → 'medida' · StoaHabit → 'constancia' · Mente → 'mente'.
 * La frase cambia una vez por día y es la misma para todas las personas de esa app.
 */
export type TemaFrase = 'esfuerzo' | 'medida' | 'constancia' | 'mente' | 'general';
export interface Frase { texto: string; autor: string; tema: TemaFrase }

export const FRASES: Frase[] = [
  // General (aparecen en todas las apps)
  { tema: 'general', texto: 'Primero decí quién querés ser; después hacé lo que tengas que hacer.', autor: 'Epicteto' },
  { tema: 'general', texto: 'No pierdas más tiempo discutiendo cómo debe ser un hombre bueno. Sé uno.', autor: 'Marco Aurelio' },
  { tema: 'general', texto: 'Nadie es libre si no es dueño de sí mismo.', autor: 'Epicteto' },
  { tema: 'general', texto: 'Hacé cada cosa como si fuera la última de tu vida.', autor: 'Marco Aurelio' },
  // Esfuerzo (StoaGym)
  { tema: 'esfuerzo', texto: 'La dificultad fortalece la mente, como el trabajo fortalece el cuerpo.', autor: 'Séneca' },
  { tema: 'esfuerzo', texto: 'El fuego prueba al oro; la adversidad, al hombre fuerte.', autor: 'Séneca' },
  { tema: 'esfuerzo', texto: 'Al amanecer, cuando te cueste levantarte, pensá: me levanto para hacer la obra de un ser humano.', autor: 'Marco Aurelio' },
  { tema: 'esfuerzo', texto: 'Lo que se interpone en el camino se vuelve el camino.', autor: 'Marco Aurelio' },
  { tema: 'esfuerzo', texto: 'Si algo es posible y propio del ser humano, pensá que también está a tu alcance.', autor: 'Marco Aurelio' },
  { tema: 'esfuerzo', texto: 'Nadie es más desdichado que quien nunca conoció la adversidad: no tuvo ocasión de probarse.', autor: 'Séneca' },
  { tema: 'esfuerzo', texto: 'Es una vergüenza envejecer sin haber visto la belleza y la fuerza de las que tu cuerpo es capaz.', autor: 'Sócrates, según Jenofonte' },
  // Medida (StoaFit)
  { tema: 'medida', texto: 'No es pobre el que tiene poco, sino el que desea más.', autor: 'Séneca' },
  { tema: 'medida', texto: 'Come para vivir; no vivas para comer.', autor: 'Sócrates, según Diógenes Laercio' },
  { tema: 'medida', texto: 'La medida es la mejor de las cosas.', autor: 'Cleóbulo, según Diógenes Laercio' },
  { tema: 'medida', texto: 'Si querés hacer rico a alguien, no le agregues dinero: quitale deseos.', autor: 'Epicuro, citado por Séneca' },
  { tema: 'medida', texto: 'Dale al cuerpo lo necesario para la salud: comida para el hambre, bebida para la sed.', autor: 'Séneca' },
  { tema: 'medida', texto: 'Muy poco hace falta para una vida feliz.', autor: 'Marco Aurelio' },
  { tema: 'medida', texto: 'No es libre quien es esclavo de su cuerpo.', autor: 'Séneca' },
  { tema: 'medida', texto: 'Elegí la comida para nutrirte, no solo para el placer.', autor: 'Musonio Rufo' },
  // Constancia (StoaHabit)
  { tema: 'constancia', texto: 'Ninguna gran cosa se crea de repente; ni siquiera el racimo de uvas o el higo.', autor: 'Epicteto' },
  { tema: 'constancia', texto: 'Toda costumbre crece y se fortalece con los actos que le corresponden.', autor: 'Epicteto' },
  { tema: 'constancia', texto: 'Si querés hacer de algo un hábito, hacelo.', autor: 'Epicteto' },
  { tema: 'constancia', texto: 'La felicidad se alcanza con pasos pequeños, pero no es cosa pequeña.', autor: 'Zenón de Citio, según Diógenes Laercio' },
  { tema: 'constancia', texto: 'No es que tengamos poco tiempo, sino que perdemos mucho.', autor: 'Séneca' },
  { tema: 'constancia', texto: 'Mientras esperamos vivir, la vida pasa.', autor: 'Séneca' },
  { tema: 'constancia', texto: 'Cada día, una línea.', autor: 'Plinio, sobre el pintor Apeles' },
  // Mente (la futura app)
  { tema: 'mente', texto: 'No nos perturban las cosas, sino las opiniones que tenemos sobre ellas.', autor: 'Epicteto' },
  { tema: 'mente', texto: 'Sufrimos más a menudo en la imaginación que en la realidad.', autor: 'Séneca' },
  { tema: 'mente', texto: 'Ocupate de lo que depende de vos; lo demás, dejalo ir.', autor: 'Epicteto' },
  { tema: 'mente', texto: 'Tenés poder sobre tu mente, no sobre los hechos de afuera. Sabelo y encontrarás fuerza.', autor: 'Marco Aurelio' },
  { tema: 'mente', texto: 'La felicidad de tu vida depende de la calidad de tus pensamientos.', autor: 'Marco Aurelio' },
  { tema: 'mente', texto: 'Mirá hacia adentro: dentro está la fuente del bien, que puede brotar siempre si siempre cavás.', autor: 'Marco Aurelio' },
];

/** La frase del día del tema de la app (cambia a medianoche; igual para todos los de esa app) */
export function fraseDelDia(tema: Exclude<TemaFrase, 'general'>, t = Date.now()): Frase {
  const lista = FRASES.filter((f) => f.tema === tema || f.tema === 'general');
  const d = new Date(t);
  const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return lista[n % lista.length];
}
