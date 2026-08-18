import { EstudianteReporte } from '../types';

const NOMBRES_COMUNES = new Set([
  'juan', 'maria', 'maría', 'carlos', 'ana', 'luis', 'jose', 'josé', 'laura',
  'sara', 'santiago', 'valentina', 'sofia', 'sofía', 'mariana', 'alejandra',
  'jeremy', 'juana', 'isabella', 'luciana', 'camilo', 'samantha', 'danna',
  'guadalupe', 'emanuel', 'manuel', 'kevin', 'edwin', 'melany', 'eliana',
  'andres', 'andrés', 'david', 'felipe', 'daniel', 'diego', 'sebastian',
  'sebastián', 'mateo', 'nicolas', 'nicolás', 'samuel', 'gabriela', 'valeria',
  'salome', 'salomé', 'antonia', 'lucia', 'lucía', 'camila', 'natalia',
  'paula', 'juliana', 'luz', 'nelly', 'nini', 'johana', 'rosa', 'amelia',
  'lina', 'marcela', 'ingrid', 'lizeh', 'julieth', 'cecilia', 'mary',
  'adiela', 'sabina', 'marta', 'martha', 'victor', 'hugo', 'jorge', 'hector',
  'alexander', 'albeiro', 'fernando', 'javier', 'jhon', 'jhonatan', 'brayan',
  'esteban', 'miguel', 'angel', 'ángel', 'christian', 'cristian', 'jesus', 'jesús'
]);

/**
 * Extrae el primer apellido probable de un estudiante colombiano
 */
export function extraerPrimerApellido(nombreCompleto: string): string {
  if (!nombreCompleto) return '';
  const palabras = nombreCompleto.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0];

  // Caso típico de 3 o 4 palabras: "Sara Valentina Azcárate Orjuela"
  if (palabras.length === 4) {
    // Si la 1ra y 2da son nombres (ej. Sara Valentina), el 1er apellido es la 3ra palabra (Azcárate)
    return palabras[2];
  }

  if (palabras.length === 3) {
    const primeraMinus = palabras[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const segundaMinus = palabras[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Si la 1ra y 2da son nombres conocidos (ej. Laura Sofía Herrán), el apellido es la 3ra
    if (NOMBRES_COMUNES.has(primeraMinus) && NOMBRES_COMUNES.has(segundaMinus)) {
      return palabras[2];
    }
    // Si la 1ra es nombre y la 2da no (ej. Jeremy Villanueva Meneses), el 1er apellido es la 2da
    if (NOMBRES_COMUNES.has(primeraMinus)) {
      return palabras[1];
    }
    // Si parece "Apellido1 Apellido2 Nombre" (ej. Gómez Toro Carlos)
    return palabras[0];
  }

  if (palabras.length === 2) {
    const primeraMinus = palabras[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (NOMBRES_COMUNES.has(primeraMinus)) {
      return palabras[1];
    }
    return palabras[0];
  }

  // Si tiene más de 4 palabras, buscar la primera palabra que no sea un nombre de pila
  for (let i = 1; i < palabras.length; i++) {
    const w = palabras[i].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!NOMBRES_COMUNES.has(w)) {
      return palabras[i];
    }
  }

  return palabras[palabras.length - 1];
}

/**
 * Ordena estudiantes alfabéticamente por primer apellido (A - Z)
 */
export function ordenarEstudiantesPorPrimerApellido(estudiantes: EstudianteReporte[]): EstudianteReporte[] {
  return [...estudiantes].sort((a, b) => {
    const apeA = extraerPrimerApellido(a.nombre_estudiante).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const apeB = extraerPrimerApellido(b.nombre_estudiante).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const cmp = apeA.localeCompare(apeB, 'es', { sensitivity: 'base' });
    if (cmp !== 0) return cmp;

    return a.nombre_estudiante.localeCompare(b.nombre_estudiante, 'es', { sensitivity: 'base' });
  });
}
