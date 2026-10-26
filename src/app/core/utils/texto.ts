export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function coincide(busqueda: string, ...campos: string[]): boolean {
  const palabras = normalizar(busqueda).split(' ').filter(Boolean);
  const texto = normalizar(campos.join(' '));
  return palabras.every(palabra => texto.includes(palabra));
}
