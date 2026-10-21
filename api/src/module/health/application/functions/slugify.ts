/**
 * Gera um slug a partir de um texto.
 * "Em Paz" -> "em-paz" | "Ansiosa(o)!" -> "ansiosa-o" | "  Cansaço  " -> "cansaco"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD') // separa letras dos acentos
    .replace(/[\u0300-\u036f]/g, '') // remove os acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // qualquer coisa que não seja letra/número vira "-"
    .replace(/^-+|-+$/g, ''); // remove "-" no início e no fim
}
