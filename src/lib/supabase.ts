import { createClient } from '@supabase/supabase-js';
import { EstudianteReporte, NivelUrgencia, TipoAyuda, HistorialAyuda, AyudasContador } from '../types';
import { repararTextoEspecial, limpiarTelefono } from './textCleaner';

export const SUPABASE_URL = 'https://gpgobcwayrbksqrpvhfk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_JdOG8jM0G6_mapL2LxA47g_Q5L5bnJx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nombre de la tabla principal según la configuración
export const DEFAULT_TABLE_NAME = 'Encuesta';

// Tabla adicional para guardar eventos y entregas de ayudas sincronizadas en línea
export const EVENTS_TABLE_NAME = 'entregas_ayudas';

const DELETED_STUDENTS_STORAGE_KEY = 'gidelca_renace_deleted_students_v1';

/**
 * Obtiene la lista de identificadores de estudiantes eliminados localmente
 */
export function obtenerEstudiantesEliminados(): string[] {
  try {
    const data = localStorage.getItem(DELETED_STUDENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Registra un estudiante como eliminado para evitar que reaparezca al recargar
 */
export function marcarEstudianteEliminado(identifier: string) {
  if (!identifier) return;
  try {
    const list = obtenerEstudiantesEliminados();
    if (!list.includes(identifier)) {
      list.push(identifier);
      localStorage.setItem(DELETED_STUDENTS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Error registrando eliminado:', e);
  }
}

/**
 * Remueve un identificador de la lista de eliminados si se vuelve a crear
 */
export function desmarcarEstudianteEliminado(identifier: string) {
  if (!identifier) return;
  try {
    const list = obtenerEstudiantesEliminados().filter((id) => id !== identifier);
    localStorage.setItem(DELETED_STUDENTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error desmarcando eliminado:', e);
  }
}

/**
 * Normaliza nombres de columnas eliminando tildes y signos para matching flexible
 */
function cleanKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normaliza cualquier fila proveniente de la tabla Encuesta de Supabase
 */
export function normalizarEstudianteDesdeSupabase(rawRow: any, index = 0): EstudianteReporte {
  const cleanMap: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawRow || {})) {
    cleanMap[cleanKey(k)] = v;
  }

  const findVal = (keywords: string[]): any => {
    for (const kw of keywords) {
      const cleanKw = cleanKey(kw);
      if (cleanMap[cleanKw] !== undefined && cleanMap[cleanKw] !== null && cleanMap[cleanKw] !== '') {
        return cleanMap[cleanKw];
      }
      for (const [ck, val] of Object.entries(cleanMap)) {
        if (ck.includes(cleanKw) && val !== undefined && val !== null && val !== '') {
          return val;
        }
      }
    }
    return '';
  };

  // 1. Nombre original y limpio del Estudiante
  const raw_nombre_original = String(
    rawRow.nombre_estudiante ||
    findVal([
      'nombreestudiante',
      'nombresyapellidosdelestudiante',
      'nombresyapellidos',
      'nombrecompleto',
      'nombre',
      'estudiante'
    ]) ||
    `Estudiante #${index + 1}`
  ).trim();

  const rawNombre = repararTextoEspecial(raw_nombre_original);

  // 2. Grado y Grupo (ej: 8-2, 6-2, 4-1, 2-3, 11-1, 0-2)
  let rawGrado = String(
    rawRow.grado ||
    findVal([
      'grado',
      'gradoygrupo',
      'gradoescolar',
      'gradoalquepertenece',
      'grupo',
      'curso'
    ]) ||
    'Sin Grado'
  ).trim();
  rawGrado = normalizarCodigoGrado(rawGrado);

  // 3. ID de base de datos y ID de la aplicación
  const raw_db_id = rawRow.id ?? rawRow.ID ?? rawRow.uuid ?? rawRow._id ?? rawRow.id_encuesta ?? rawRow.id_estudiante;
  const slugNombre = cleanKey(rawNombre);
  const slugGrado = cleanKey(rawGrado);
  const id = String(
    raw_db_id ||
    `gid_${slugGrado}_${slugNombre}_${index}`
  );

  // 4. Fecha de reporte
  const fecha_reporte = String(
    rawRow.fecha_reporte ||
    findVal(['fechareporte', 'marcatemporal', 'timestamp', 'fecha', 'createdat']) ||
    new Date().toISOString().split('T')[0]
  );

  // 5. Acudiente (reparando caracteres especiales)
  let nombre_acudiente = String(
    rawRow.nombre_acudiente ||
    findVal(['nombreacudiente', 'nombredelacudiente', 'acudiente', 'padremadre', 'responsable']) ||
    ''
  ).trim();
  nombre_acudiente = repararTextoEspecial(nombre_acudiente);

  // 6. Teléfono
  const telefono = limpiarTelefono(
    String(
      rawRow.telefono ||
      findVal(['telefono', 'telefonodelacudiente', 'numerodecelular', 'celular', 'contacto']) ||
      ''
    )
  );

  // 7. Dirección
  let direccion = String(
    rawRow.direccion ||
    findVal(['direccion', 'direccionderesidencia', 'residencia', 'lugarderesidencia']) ||
    ''
  ).trim();
  direccion = repararTextoEspecial(direccion);

  // 8. Ubicación
  let ubicacion = String(
    rawRow.ubicacion ||
    findVal(['ubicacion', 'barrioovereda', 'barrio', 'vereda', 'sector', 'zona']) ||
    direccion ||
    'Calima El Darién'
  ).trim();
  ubicacion = repararTextoEspecial(ubicacion);

  // 9. Lesiones Físicas
  const leciones_fisicas = String(
    rawRow.leciones_fisicas ||
    rawRow.lesiones_fisicas ||
    findVal(['lecionesfisicas', 'lesionesfisicas', 'presentalesionesfisicas', 'lesiones']) ||
    'No'
  ).trim();

  // 10. Salud Emocional
  let salud_emocional = String(
    rawRow.salud_emocional ||
    findVal(['saludemocional', 'afectacionemocional', 'estadopsicologico', 'emocional']) ||
    'Estable'
  ).trim();
  salud_emocional = repararTextoEspecial(salud_emocional);

  // 11. Condición de Vivienda
  let condicion_vivienda = String(
    rawRow.condicion_vivienda ||
    findVal(['condicionvivienda', 'estadodelavivienda', 'condiciondevivienda', 'vivienda']) ||
    'Habitable'
  ).trim();
  condicion_vivienda = repararTextoEspecial(condicion_vivienda);

  // 12. Ayuda Prioritaria (conservando opciones múltiples del formulario)
  let ayuda_prioritaria = String(
    rawRow.ayuda_prioritaria ||
    findVal(['ayudaprioritaria', 'tipoayuda', 'ayudarequerida', 'prioridad', 'necesidad', 'requierenayudaprioritaria', 'ayudaprioritariaenestemomento']) ||
    'Alimentos no perecederos y agua potable'
  ).trim();
  ayuda_prioritaria = repararTextoEspecial(ayuda_prioritaria);

  // 13. Conectividad (conservando opciones múltiples del formulario)
  let conectividad = String(
    rawRow.conectividad ||
    findVal(['conectividad', 'mediosdeconectividad', 'internet', 'accesoainternet', 'conexion', 'dispositivos']) ||
    'Conexión a internet estable y computador/tablet propia'
  ).trim();
  conectividad = repararTextoEspecial(conectividad);

  // Estructura de ayudas inicial
  const ayudas_entregadas: AyudasContador = {
    Alimento: 0,
    Medicamento: 0,
    Ropa: 0,
    Emocional: 0,
    Construccion: 0
  };

  const historial_ayudas: HistorialAyuda[] = [];

  const parcial: Partial<EstudianteReporte> = {
    id,
    nombre_estudiante: rawNombre,
    grado: rawGrado,
    nombre_acudiente,
    telefono,
    direccion,
    ubicacion,
    leciones_fisicas,
    salud_emocional,
    condicion_vivienda,
    ayuda_prioritaria,
    conectividad,
    fecha_reporte
  };

  const nivel_urgencia = rawRow.nivel_urgencia || calcularNivelUrgencia(parcial);

  return {
    id,
    fecha_reporte,
    nombre_estudiante: rawNombre,
    grado: rawGrado,
    nombre_acudiente,
    telefono,
    direccion,
    leciones_fisicas,
    salud_emocional,
    ubicacion,
    condicion_vivienda,
    ayuda_prioritaria,
    conectividad,
    nivel_urgencia,
    ayudas_entregadas,
    historial_ayudas,
    raw_db_id,
    raw_nombre_original
  };
}

/**
 * Normaliza nombres de grados como "8-2", "6-2", "4-1", "2-3", "11-1", "0-2", "Transición 1"
 */
export function normalizarCodigoGrado(gradoStr: string): string {
  if (!gradoStr) return 'Sin Grado';
  let clean = gradoStr.trim().replace(/^grado\s+/i, '').replace(/°/g, '');
  clean = clean.replace(/[._]/g, '-');

  if (/transici[oó]n/i.test(clean) || /preescolar/i.test(clean) || /jardin/i.test(clean)) {
    const matchGroup = clean.match(/\d+/);
    return matchGroup ? `0-${matchGroup[0]}` : '0-1';
  }

  const wordMap: Record<string, string> = {
    primero: '1',
    segundo: '2',
    tercero: '3',
    cuarto: '4',
    quinto: '5',
    sexto: '6',
    septimo: '7',
    séptimo: '7',
    octavo: '8',
    noveno: '9',
    decimo: '10',
    décimo: '10',
    once: '11'
  };

  for (const [w, num] of Object.entries(wordMap)) {
    if (clean.toLowerCase().includes(w)) {
      const match = clean.match(/\d+/);
      return match ? `${num}-${match[0]}` : `${num}-1`;
    }
  }

  const pattern = clean.match(/^(\d{1,2})\s*[-/]?\s*(\d{1,2})?$/);
  if (pattern) {
    const gradoNum = pattern[1];
    const grupoNum = pattern[2] || '1';
    return `${gradoNum}-${grupoNum}`;
  }

  return clean;
}

/**
 * Extrae y ordena jerárquicamente la lista de grados escolares únicos
 */
export function ordenarGradosEscolares(grados: string[]): string[] {
  const parseGrade = (g: string) => {
    if (g === 'Todos') return -1;
    const match = g.match(/^(\d+)-(\d+)$/);
    if (match) {
      const principal = parseInt(match[1], 10);
      const grupo = parseInt(match[2], 10);
      return principal * 100 + grupo;
    }
    const singleNum = parseInt(g.replace(/\D/g, ''), 10);
    if (!isNaN(singleNum)) return singleNum * 100;
    return 9999;
  };

  return [...grados].sort((a, b) => parseGrade(a) - parseGrade(b));
}

export function obtenerGradosOrdenados(estudiantes: EstudianteReporte[]): string[] {
  const setGrados = new Set<string>();
  estudiantes.forEach((e) => {
    if (e.grado && e.grado.trim() !== '') {
      setGrados.add(e.grado.trim());
    }
  });

  return Array.from(setGrados).sort((a, b) => {
    const parseGrade = (g: string) => {
      const match = g.match(/^(\d+)-(\d+)$/);
      if (match) {
        const principal = parseInt(match[1], 10);
        const grupo = parseInt(match[2], 10);
        return principal * 100 + grupo;
      }
      const singleNum = parseInt(g.replace(/\D/g, ''), 10) || 999;
      return singleNum * 100;
    };

    return parseGrade(a) - parseGrade(b);
  });
}

/**
 * Script SQL para crear o configurar la tabla y políticas RLS de Supabase
 */
export const SUPABASE_SCHEMA_SQL = `-- 1. Tabla principal del censo (Encuesta)
CREATE TABLE IF NOT EXISTS public."Encuesta" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    nombre_estudiante TEXT NOT NULL,
    grado TEXT NOT NULL,
    nombre_acudiente TEXT,
    telefono TEXT,
    direccion TEXT,
    leciones_fisicas TEXT,
    salud_emocional TEXT,
    ubicacion TEXT,
    condicion_vivienda TEXT,
    ayuda_prioritaria TEXT,
    conectividad TEXT,
    nivel_urgencia TEXT
);

-- Habilitar RLS y permitir todas las operaciones (SELECT, INSERT, UPDATE, DELETE) para anon
ALTER TABLE public."Encuesta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios anon en Encuesta" ON public."Encuesta"
FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Tabla adicional de eventos de entregas de ayudas sincronizadas en línea
CREATE TABLE IF NOT EXISTS public.entregas_ayudas (
    id TEXT PRIMARY KEY,
    estudiante_id TEXT NOT NULL,
    nombre_estudiante TEXT,
    grado TEXT,
    tipo_ayuda TEXT NOT NULL,
    cantidad NUMERIC DEFAULT 1,
    fecha TEXT NOT NULL,
    responsable TEXT NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.entregas_ayudas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios anon en entregas_ayudas" ON public.entregas_ayudas
FOR ALL TO anon USING (true) WITH CHECK (true);
`;

/**
 * Parsea un archivo CSV proveniente de Google Forms o exportaciones
 */
export function parsearCSVGoogleForms(csvText: string): EstudianteReporte[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());

  return lines.slice(1).map((line, idx) => {
    const values: string[] = [];
    let insideQuotes = false;
    let currentVal = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h] = values[i] || '';
    });

    return normalizarEstudianteDesdeSupabase(rowObj, idx);
  });
}

/**
 * Carga todos los estudiantes desde la tabla principal (ej: Encuesta)
 * y los cruza con la tabla de eventos en línea (entregas_ayudas).
 */
export async function cargarTodosLosEstudiantesSupabase(tableName = DEFAULT_TABLE_NAME): Promise<{
  data: EstudianteReporte[];
  error: any;
}> {
  try {
    const allRows: any[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;
    let to = PAGE_SIZE - 1;
    let hasMore = true;
    let iterations = 0;
    let usedTableName = tableName;

    // Intentar primero con el nombre exacto de la tabla (ej. Encuesta o encuesta)
    while (hasMore && iterations < 5) {
      iterations++;
      let { data, error } = await supabase
        .from(usedTableName)
        .select('*')
        .range(from, to);

      // Si falla y es 'Encuesta', probar con minúsculas 'encuesta' o viceversa
      if (error && iterations === 1) {
        const altName = usedTableName === 'Encuesta' ? 'encuesta' : 'Encuesta';
        const altResponse = await supabase.from(altName).select('*').range(from, to);
        if (!altResponse.error && altResponse.data) {
          usedTableName = altName;
          data = altResponse.data;
          error = null;
        }
      }

      if (error) {
        return { data: [], error };
      }

      if (data && data.length > 0) {
        allRows.push(...data);
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
          to += PAGE_SIZE;
        }
      } else {
        hasMore = false;
      }
    }

    // Filtrar los estudiantes que fueron eliminados por el usuario
    const eliminados = obtenerEstudiantesEliminados();

    // Normalizar todos los estudiantes de la encuesta excluyendo eliminados
    const estudiantes = allRows
      .map((r, i) => normalizarEstudianteDesdeSupabase(r, i))
      .filter((e) => {
        const keyClean = cleanKey(e.nombre_estudiante);
        const originalClean = e.raw_nombre_original ? cleanKey(e.raw_nombre_original) : '';
        const isDeleted =
          eliminados.includes(e.id) ||
          eliminados.includes(keyClean) ||
          (originalClean && eliminados.includes(originalClean)) ||
          (e.raw_db_id && eliminados.includes(String(e.raw_db_id)));

        return !isDeleted;
      });

    // Cargar los eventos / entregas registradas en línea desde EVENTS_TABLE_NAME
    try {
      const { data: eventos, error: eventosError } = await supabase
        .from(EVENTS_TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      if (!eventosError && Array.isArray(eventos) && eventos.length > 0) {
        const studentMap = new Map<string, EstudianteReporte>();
        estudiantes.forEach((e) => {
          const keyNameGrade = `${cleanKey(e.nombre_estudiante)}_${cleanKey(e.grado)}`;
          studentMap.set(e.id, e);
          studentMap.set(keyNameGrade, e);
        });

        eventos.forEach((ev: any) => {
          const target =
            studentMap.get(ev.estudiante_id) ||
            studentMap.get(`${cleanKey(ev.nombre_estudiante || '')}_${cleanKey(ev.grado || '')}`);

          if (target) {
            const tipo = (ev.tipo_ayuda || 'Alimento') as TipoAyuda;
            const cant = Number(ev.cantidad) || 1;

            if (!target.ayudas_entregadas) {
              target.ayudas_entregadas = {
                Alimento: 0,
                Medicamento: 0,
                Ropa: 0,
                Emocional: 0,
                Construccion: 0
              };
            }
            target.ayudas_entregadas[tipo] = (target.ayudas_entregadas[tipo] || 0) + cant;

            const histItem: HistorialAyuda = {
              id: String(ev.id || `ev_${Math.random()}`),
              tipo,
              fecha: ev.fecha || new Date().toISOString().split('T')[0],
              responsable: ev.responsable || 'Comité Gidelca',
              observaciones: ev.observaciones || '',
              cantidad: cant
            };

            if (!target.historial_ayudas) {
              target.historial_ayudas = [];
            }
            target.historial_ayudas.push(histItem);
          }
        });
      }
    } catch (e) {
      console.warn('Aviso cargando eventos de entregas_ayudas:', e);
    }

    return { data: estudiantes, error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Registra un evento de entrega en la tabla online adicional (entregas_ayudas)
 */
export async function registrarEventoAyudaEnSupabase(
  estudiante: EstudianteReporte,
  tipo: TipoAyuda,
  cantidad: number,
  fecha: string,
  responsable: string,
  observaciones: string
): Promise<{ success: boolean; id: string; error: any }> {
  try {
    const eventId = `ayuda_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payload = {
      id: eventId,
      estudiante_id: estudiante.id,
      nombre_estudiante: estudiante.nombre_estudiante,
      grado: estudiante.grado,
      tipo_ayuda: tipo,
      cantidad,
      fecha,
      responsable,
      observaciones,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from(EVENTS_TABLE_NAME).insert([payload]);

    if (error) {
      console.warn('Error al sincronizar evento en entregas_ayudas:', error.message);
      return { success: false, id: eventId, error };
    }

    return { success: true, id: eventId, error: null };
  } catch (err) {
    console.warn('Fallo guardando evento en Supabase:', err);
    return { success: false, id: '', error: err };
  }
}

/**
 * Elimina un evento de entrega de ayuda en Supabase para deshacer o corregir un error
 */
export async function eliminarEventoAyudaEnSupabase(
  eventoId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from(EVENTS_TABLE_NAME)
      .delete()
      .eq('id', eventoId);

    if (error) {
      console.warn('Error eliminando evento en entregas_ayudas:', error.message);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('Fallo eliminando evento en Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Guarda o actualiza un estudiante en la tabla principal (Encuesta)
 */
export async function guardarEstudianteEnSupabase(
  estudiante: EstudianteReporte,
  tableName = DEFAULT_TABLE_NAME
): Promise<{ success: boolean; error: any }> {
  try {
    // Si estaba previamente marcado como eliminado, removerlo de la lista negra
    desmarcarEstudianteEliminado(estudiante.id);
    desmarcarEstudianteEliminado(cleanKey(estudiante.nombre_estudiante));
    if (estudiante.raw_db_id) {
      desmarcarEstudianteEliminado(String(estudiante.raw_db_id));
    }

    const payload: Record<string, any> = {
      fecha_reporte: estudiante.fecha_reporte || new Date().toISOString().split('T')[0],
      nombre_estudiante: estudiante.nombre_estudiante,
      grado: estudiante.grado,
      nombre_acudiente: estudiante.nombre_acudiente || '',
      telefono: estudiante.telefono || '',
      direccion: estudiante.direccion || '',
      leciones_fisicas: estudiante.leciones_fisicas || 'No',
      salud_emocional: estudiante.salud_emocional || 'Estable',
      ubicacion: estudiante.ubicacion || 'Calima El Darién',
      condicion_vivienda: estudiante.condicion_vivienda || 'Habitable',
      ayuda_prioritaria: estudiante.ayuda_prioritaria || 'Alimento',
      conectividad: estudiante.conectividad || 'Buena'
    };

    if (estudiante.raw_db_id) {
      payload.id = estudiante.raw_db_id;
    } else if (estudiante.id && !estudiante.id.startsWith('gid_')) {
      payload.id = estudiante.id;
    }

    // Intentar upsert o insert en la tabla especificada
    let { error } = await supabase.from(tableName).upsert(payload);

    // Si falló por case sensitivity (Encuesta vs encuesta), reintentar
    if (error) {
      const altName = tableName === 'Encuesta' ? 'encuesta' : 'Encuesta';
      const retry = await supabase.from(altName).upsert(payload);
      if (!retry.error) {
        return { success: true, error: null };
      }
      // Si upsert falló por falta de primary key 'id', probar insert directo
      const insertTry = await supabase.from(tableName).insert([payload]);
      if (!insertTry.error) {
        return { success: true, error: null };
      }
      return { success: false, error: insertTry.error || error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('Fallo guardando estudiante en Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Elimina un estudiante permanentemente de la base de datos y de la sesión local
 */
export async function eliminarEstudianteEnSupabase(
  estudiante: EstudianteReporte,
  tableName = DEFAULT_TABLE_NAME
): Promise<{ success: boolean; error: any }> {
  // 1. Guardar de inmediato en la lista negra local para garantizar que NUNCA reaparezca al recargar
  marcarEstudianteEliminado(estudiante.id);
  marcarEstudianteEliminado(cleanKey(estudiante.nombre_estudiante));
  if (estudiante.raw_db_id) {
    marcarEstudianteEliminado(String(estudiante.raw_db_id));
  }
  if (estudiante.raw_nombre_original) {
    marcarEstudianteEliminado(cleanKey(estudiante.raw_nombre_original));
  }

  try {
    const targetTables = [tableName, tableName === 'Encuesta' ? 'encuesta' : 'Encuesta'];
    const nameVariants = [
      estudiante.nombre_estudiante,
      estudiante.raw_nombre_original
    ].filter(Boolean) as string[];

    const candidateColumns = [
      'nombre_estudiante',
      'Nombre del estudiante',
      'Nombres y Apellidos del Estudiante',
      'nombres_y_apellidos',
      'nombre_completo',
      'nombre',
      'Nombre'
    ];

    for (const tbl of targetTables) {
      // 1. Borrar por raw_db_id
      if (estudiante.raw_db_id) {
        try {
          await supabase.from(tbl).delete().eq('id', estudiante.raw_db_id);
        } catch {}
      }

      // 2. Borrar por id
      if (estudiante.id && !estudiante.id.startsWith('gid_')) {
        try {
          await supabase.from(tbl).delete().eq('id', estudiante.id);
        } catch {}
      }

      // 3. Borrar por variantes de nombre
      for (const col of candidateColumns) {
        for (const nameVal of nameVariants) {
          try {
            await supabase.from(tbl).delete().eq(col, nameVal);
          } catch {}
        }
      }
    }

    // 4. Limpiar eventos de ayuda asociados
    try {
      await supabase.from(EVENTS_TABLE_NAME).delete().eq('estudiante_id', estudiante.id);
    } catch {}

    return { success: true, error: null };
  } catch (err) {
    console.warn('Aviso eliminando estudiante de Supabase:', err);
    return { success: true, error: err };
  }
}

/**
 * Determina automáticamente el color del semáforo de urgencia basado en las respuestas de la encuesta
 */
export function calcularNivelUrgencia(estudiante: Partial<EstudianteReporte>): NivelUrgencia {
  const tieneDatos = Boolean(
    estudiante.nombre_estudiante &&
    (estudiante.condicion_vivienda || estudiante.leciones_fisicas || estudiante.salud_emocional || estudiante.ayuda_prioritaria)
  );

  if (!tieneDatos) return 'gris';

  const fisica = (estudiante.leciones_fisicas || '').toLowerCase();
  const emocional = (estudiante.salud_emocional || '').toLowerCase();
  const vivienda = (estudiante.condicion_vivienda || '').toLowerCase();
  const ayuda = (estudiante.ayuda_prioritaria || '').toLowerCase();

  const esRojo =
    fisica.includes('fractura') ||
    fisica.includes('grave') ||
    fisica.includes('sever') ||
    fisica.includes('hospital') ||
    fisica.includes('cirug') ||
    emocional.includes('sever') ||
    emocional.includes('crisis') ||
    emocional.includes('panico') ||
    vivienda.includes('destru') ||
    vivienda.includes('inhabitable') ||
    vivienda.includes('colapso') ||
    vivienda.includes('severo') ||
    ayuda.includes('medic');

  if (esRojo) return 'rojo';

  const esNaranja =
    fisica.includes('golpe') ||
    fisica.includes('trauma') ||
    fisica.includes('esguince') ||
    fisica.includes('herida') ||
    fisica.includes('leve') ||
    emocional.includes('angustia') ||
    emocional.includes('ansiedad') ||
    emocional.includes('miedo') ||
    emocional.includes('preocup') ||
    emocional.includes('triste') ||
    emocional.includes('duelo') ||
    vivienda.includes('techo') ||
    vivienda.includes('tejas') ||
    vivienda.includes('parcial') ||
    vivienda.includes('inunda') ||
    ayuda.includes('alimento') ||
    ayuda.includes('construc');

  if (esNaranja) return 'naranja';

  const esVerde =
    (fisica.includes('no') || fisica.includes('ningun') || fisica === '') &&
    (emocional.includes('bien') || emocional.includes('estable') || emocional.includes('tranquilo')) &&
    (vivienda.includes('buen') || vivienda.includes('habitable') || vivienda.includes('sin da'));

  if (esVerde) return 'verde';

  return 'naranja';
}
