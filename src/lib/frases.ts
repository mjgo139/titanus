export interface Frase { texto: string; autor: 'Séneca' | 'Marco Aurelio' | 'Epicteto' }

/** Traducciones libres de textos clásicos (dominio público) */
export const FRASES: Frase[] = [
  { texto: 'Ningún hombre es más desdichado que aquel a quien nunca le tocó la adversidad: no tuvo ocasión de probarse.', autor: 'Séneca' },
  { texto: 'La dificultad fortalece la mente, como el trabajo fortalece el cuerpo.', autor: 'Séneca' },
  { texto: 'Sufrimos más a menudo en la imaginación que en la realidad.', autor: 'Séneca' },
  { texto: 'Mientras esperamos vivir, la vida pasa.', autor: 'Séneca' },
  { texto: 'No es que tengamos poco tiempo, sino que perdemos mucho.', autor: 'Séneca' },
  { texto: 'Lo que la razón no curó, muchas veces lo curó el tiempo; empezá hoy.', autor: 'Séneca' },
  { texto: 'El fuego prueba al oro; la adversidad, al hombre fuerte.', autor: 'Séneca' },
  { texto: 'Al amanecer, cuando te cueste levantarte, pensá: me levanto para hacer la obra de un ser humano.', autor: 'Marco Aurelio' },
  { texto: 'El obstáculo en el camino se convierte en el camino.', autor: 'Marco Aurelio' },
  { texto: 'Tenés poder sobre tu mente, no sobre los hechos de afuera. Sabelo y encontrarás fuerza.', autor: 'Marco Aurelio' },
  { texto: 'No pierdas más tiempo discutiendo cómo debe ser un buen hombre. Sé uno.', autor: 'Marco Aurelio' },
  { texto: 'Hacé cada cosa como si fuera la última de tu vida.', autor: 'Marco Aurelio' },
  { texto: 'La felicidad de tu vida depende de la calidad de tus pensamientos.', autor: 'Marco Aurelio' },
  { texto: 'Si algo es posible para el hombre y adecuado, pensá que también está a tu alcance.', autor: 'Marco Aurelio' },
  { texto: 'Ninguna gran cosa se crea de repente; ni siquiera el racimo de uvas o el higo.', autor: 'Epicteto' },
  { texto: 'Primero decí quién querés ser; después hacé lo que tengas que hacer.', autor: 'Epicteto' },
  { texto: 'Cuanto mayor la dificultad, mayor la gloria al superarla.', autor: 'Epicteto' },
  { texto: 'Ocupate de lo que depende de vos; lo demás, dejalo ir.', autor: 'Epicteto' },
  { texto: 'Toda costumbre y facultad se conserva y crece con los actos que le corresponden.', autor: 'Epicteto' },
  { texto: 'Ningún hombre es libre si no es dueño de sí mismo.', autor: 'Epicteto' },
  { texto: 'No expliques tu filosofía. Encarnala.', autor: 'Epicteto' },
];

export function fraseDelDia(t = Date.now()): Frase {
  const d = new Date(t);
  const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
  return FRASES[n % FRASES.length];
}
