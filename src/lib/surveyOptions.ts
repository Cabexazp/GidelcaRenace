import { TipoAyuda } from '../types';

export const OPCIONES_AYUDA_PRIORITARIA = [
  'Alimentos no perecederos y agua potable',
  'Ropa, cobijas o colchonetas',
  'Medicamentos o kit de primeros auxilios',
  'Acompañamiento psicológico / apoyo emocional',
  'Reparaciones de vivienda / asistencia de refugio',
  'Ninguna por el momento'
] as const;

export const OPCIONES_CONECTIVIDAD = [
  'Conexión a internet estable y computador/tablet propia',
  'Solo celular con conexión Wi-Fi',
  'Celular con datos móviles limitados',
  'Sin acceso a internet ni dispositivos'
] as const;

/**
 * Mapea una opción de ayuda de la encuesta o texto libre a la categoría de ayuda del sistema
 */
export function mapearOpcionATipoAyuda(opcion: string): TipoAyuda | null {
  const lower = (opcion || '').toLowerCase();
  if (lower.includes('alimento') || lower.includes('agua') || lower.includes('nutri') || lower.includes('mercado')) {
    return 'Alimento';
  }
  if (lower.includes('ropa') || lower.includes('cobija') || lower.includes('colchoneta') || lower.includes('calzado') || lower.includes('vest')) {
    return 'Ropa';
  }
  if (lower.includes('medicamento') || lower.includes('primeros auxilios') || lower.includes('salud') || lower.includes('farm')) {
    return 'Medicamento';
  }
  if (lower.includes('psicol') || lower.includes('emocional') || lower.includes('acompan') || lower.includes('terapia')) {
    return 'Emocional';
  }
  if (lower.includes('vivienda') || lower.includes('refugio') || lower.includes('reparacion') || lower.includes('techo') || lower.includes('zinc') || lower.includes('construc')) {
    return 'Construccion';
  }
  return null;
}

/**
 * Parsea el campo de texto libre o con comas de la encuesta en un array limpio de opciones individuales
 */
export function separarOpcionesMultiples(raw: string | undefined | null): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Separar por comas o saltos de línea sin romper frases largas conocidas
  // Si contiene comas:
  const partes = trimmed.split(/,\s*(?=[A-Z¿¡]|\b[A-Za-z])/);
  if (partes.length > 1) {
    return partes.map(p => p.trim()).filter(Boolean);
  }

  // Si no se separó pero tiene comas simples
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(p => p.trim()).filter(Boolean);
  }

  return [trimmed];
}

/**
 * Extrae todos los tipos de ayuda requeridos a partir del texto de respuestas múltiples
 */
export function extraerTiposAyudaRequeridos(ayudaStr: string | undefined | null): TipoAyuda[] {
  const opciones = separarOpcionesMultiples(ayudaStr);
  const tiposSet = new Set<TipoAyuda>();

  opciones.forEach(op => {
    const tipo = mapearOpcionATipoAyuda(op);
    if (tipo) {
      tiposSet.add(tipo);
    }
  });

  // Si no encontró nada específico pero hay texto, intentar mapear el string completo
  if (tiposSet.size === 0 && ayudaStr) {
    const fallback = mapearOpcionATipoAyuda(ayudaStr);
    if (fallback) tiposSet.add(fallback);
  }

  return Array.from(tiposSet);
}
