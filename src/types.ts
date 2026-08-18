export type TipoAyuda = 'Alimento' | 'Medicamento' | 'Ropa' | 'Emocional' | 'Construccion';

export type NivelUrgencia = 'rojo' | 'naranja' | 'verde' | 'gris';

export type RolUsuario = 'administrador' | 'docente' | 'estudiante';

export interface HistorialAyuda {
  id: string;
  tipo: TipoAyuda;
  fecha: string;
  responsable: string;
  observaciones?: string;
  cantidad?: number;
}

export interface AyudasContador {
  Alimento: number;
  Medicamento: number;
  Ropa: number;
  Emocional: number;
  Construccion: number;
}

export interface EstudianteReporte {
  id: string;
  fecha_reporte: string;
  nombre_estudiante: string;
  grado: string;
  nombre_acudiente: string;
  telefono: string;
  direccion: string;
  leciones_fisicas: string;
  salud_emocional: string;
  ubicacion: string;
  condicion_vivienda: string;
  ayuda_prioritaria: string;
  conectividad: string;
  // Campos complementarios para gestión de ayudas
  nivel_urgencia?: NivelUrgencia;
  ayudas_entregadas?: AyudasContador;
  historial_ayudas?: HistorialAyuda[];
  documento_identidad?: string;
  observaciones_generales?: string;
  raw_db_id?: string | number;
  raw_nombre_original?: string;
}

export interface FiltrosBusqueda {
  texto: string;
  grado: string;
  nivelUrgencia: string;
  tipoAyuda: string;
}
