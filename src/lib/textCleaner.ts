/**
 * Utilidad avanzada para reparar errores comunes de codificación (UTF-8, Latin-1, Windows-1252)
 * y formatear nombres colombianos con tildes y eñes correctas.
 */

// Diccionario de apellidos y nombres colombianos frecuentes con tilde o eñe
const REEMPLAZOS_PALABRAS: Record<string, string> = {
  azcrate: 'Azcárate',
  azcarate: 'Azcárate',
  herran: 'Herrán',
  herrn: 'Herrán',
  muoz: 'Muñoz',
  munoz: 'Muñoz',
  fras: 'Frías',
  frias: 'Frías',
  ramrez: 'Ramírez',
  ramirez: 'Ramírez',
  marn: 'Marín',
  marin: 'Marín',
  ros: 'Ríos',
  rios: 'Ríos',
  milln: 'Millán',
  millan: 'Millán',
  martnez: 'Martínez',
  martinez: 'Martínez',
  gutirrez: 'Gutiérrez',
  gutierrez: 'Gutiérrez',
  bolaos: 'Bolaños',
  bolanos: 'Bolaños',
  blandn: 'Blandín',
  blandin: 'Blandín',
  catao: 'Cataño',
  catano: 'Cataño',
  torrs: 'Torres',
  sofa: 'Sofía',
  sofia: 'Sofía',
  andrs: 'Andrés',
  andres: 'Andrés',
  jos: 'José',
  jose: 'José',
  maran: 'María',
  mara: 'María',
  maria: 'María',
  lpez: 'López',
  lopez: 'López',
  gmez: 'Gómez',
  gomez: 'Gómez',
  prez: 'Pérez',
  perez: 'Pérez',
  snchez: 'Sánchez',
  sanchez: 'Sánchez',
  dz: 'Díaz',
  diaz: 'Díaz',
  hernndez: 'Hernández',
  hernandez: 'Hernández',
  gonzlez: 'González',
  gonzalez: 'González',
  jimnez: 'Jiménez',
  jimenez: 'Jiménez',
  rodrguez: 'Rodríguez',
  rodriguez: 'Rodríguez',
  garca: 'García',
  garcia: 'García',
  valds: 'Valdés',
  valdes: 'Valdés',
  peo: 'Peña',
  pena: 'Peña',
  veo: 'Vela',
  darin: 'Darién',
  darien: 'Darién',
  calima: 'Calima',
  canada: 'Canadá',
  cand: 'Canadá',
  va: 'Vía',
  via: 'Vía',
  remolino: 'Remolino',
  jardn: 'Jardín',
  jardin: 'Jardín'
};

/**
 * Limpia y restaura caracteres especiales rotos en textos de encuestas y nombres
 */
export function repararTextoEspecial(texto: string): string {
  if (!texto) return '';

  let limpio = String(texto);

  // 1. Limpieza de secuencias dobles UTF-8 / Mojibake comunes
  limpio = limpio
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã‘/g, 'Ñ');

  // 2. Reemplazo de caracteres de reemplazo unicode (U+FFFD ) o símbolos rotos
  // Caso de símbolos  o ? embebidos dentro de palabras como "Azcrate", "Sofa", "Muoz", "Luz Nelly Milln"
  limpio = limpio
    .replace(/(\w)[\uFFFD\?]+(\w)/g, '$1$2') // Quita el símbolo interior para matching
    .replace(/[\uFFFD\u0000-\u001F\u007F-\u009F]/g, '');

  // 3. Normalizar espacios múltiples
  limpio = limpio.replace(/\s+/g, ' ').trim();

  // 4. Formatear palabras conocidas en Title Case inteligente
  const palabras = limpio.split(' ');
  const palabrasCorregidas = palabras.map((p) => {
    const pMinus = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const pClean = p.toLowerCase().replace(/[^a-záéíóúñ]/g, '');

    // Buscar si existe en el diccionario
    if (REEMPLAZOS_PALABRAS[pClean]) {
      return REEMPLAZOS_PALABRAS[pClean];
    }
    if (REEMPLAZOS_PALABRAS[pMinus]) {
      return REEMPLAZOS_PALABRAS[pMinus];
    }

    // Si no está en el diccionario, capitalizar la primera letra
    if (p.length > 0) {
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }
    return p;
  });

  return palabrasCorregidas.join(' ');
}

/**
 * Limpia números de teléfono quitando caracteres especiales extraños
 */
export function limpiarTelefono(tel: string): string {
  if (!tel) return '';
  const digits = String(tel).replace(/[^\d+]/g, '');
  return digits;
}
