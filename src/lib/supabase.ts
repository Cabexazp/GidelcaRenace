import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EstudianteReporte, NivelUrgencia, TipoAyuda, HistorialAyuda, AyudasContador } from '../types';
import { repararTextoEspecial, limpiarTelefono } from './textCleaner';
import { mapearOpcionATipoAyuda } from './surveyOptions';

const CUSTOM_URL_STORAGE_KEY = 'gidelca_custom_supabase_url';
const CUSTOM_KEY_STORAGE_KEY = 'gidelca_custom_supabase_key';

export function getSupabaseUrl(): string {
  try {
    const saved = localStorage.getItem(CUSTOM_URL_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return (import.meta as any).env?.VITE_SUPABASE_URL || 'https://gpgobcwayrbksqrpvhfk.supabase.co';
}

export function getSupabaseAnonKey(): string {
  try {
    const saved = localStorage.getItem(CUSTOM_KEY_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JdOG8jM0G6_mapL2LxA47g_Q5L5bnJx';
}

export let SUPABASE_URL = getSupabaseUrl();
export let SUPABASE_ANON_KEY = getSupabaseAnonKey();

export let supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function actualizarCredencialesSupabase(newUrl: string, newKey: string): SupabaseClient {
  const url = newUrl.trim();
  const key = newKey.trim();
  try {
    if (url) localStorage.setItem(CUSTOM_URL_STORAGE_KEY, url);
    else localStorage.removeItem(CUSTOM_URL_STORAGE_KEY);

    if (key) localStorage.setItem(CUSTOM_KEY_STORAGE_KEY, key);
    else localStorage.removeItem(CUSTOM_KEY_STORAGE_KEY);
  } catch {}

  SUPABASE_URL = url || getSupabaseUrl();
  SUPABASE_ANON_KEY = key || getSupabaseAnonKey();
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

// Nombre de la tabla principal según la configuración
export const DEFAULT_TABLE_NAME = 'Encuesta';

// Tabla adicional para guardar eventos y entregas de ayudas sincronizadas en línea
export const EVENTS_TABLE_NAME = 'entregas_ayudas';

const DELETED_STUDENTS_STORAGE_KEY = 'gidelca_renace_deleted_students_v1';
const LOCAL_CUSTOM_STUDENTS_KEY = 'gidelca_renace_local_students_v1';

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
 * Guarda copia de respaldo local de los estudiantes para persistencia inmediata
 */
export function guardarEstudiantesLocalesEnCache(estudiantes: EstudianteReporte[]) {
  try {
    localStorage.setItem(LOCAL_CUSTOM_STUDENTS_KEY, JSON.stringify(estudiantes));
  } catch (e) {
    console.warn('Error guardando caché local:', e);
  }
}

export function obtenerEstudiantesLocalesEnCache(): EstudianteReporte[] {
  try {
    const saved = localStorage.getItem(LOCAL_CUSTOM_STUDENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

const LOCAL_AID_EVENTS_KEY = 'gidelca_renace_local_aid_events_v1';

export function obtenerEventosAyudaLocales(): any[] {
  try {
    const saved = localStorage.getItem(LOCAL_AID_EVENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function guardarEventoAyudaLocalmente(evento: any) {
  try {
    const list = obtenerEventosAyudaLocales();
    const existingIndex = list.findIndex((e) => e.id === evento.id);
    if (existingIndex >= 0) {
      list[existingIndex] = evento;
    } else {
      list.push(evento);
    }
    localStorage.setItem(LOCAL_AID_EVENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error guardando evento local:', e);
  }
}

export function eliminarEventoAyudaLocalmente(eventoId: string) {
  try {
    const list = obtenerEventosAyudaLocales().filter((e) => e.id !== eventoId);
    localStorage.setItem(LOCAL_AID_EVENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error eliminando evento local:', e);
  }
}

/**
 * Normaliza nombres de columnas eliminando tildes y signos para matching flexible
 */
export function cleanKey(key: string): string {
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

  const grado = normalizarCodigoGrado(rawGrado);

  // 3. Nombre del Acudiente
  const nombre_acudiente = repararTextoEspecial(
    String(
      rawRow.nombre_acudiente ||
      findVal([
        'nombreacudiente',
        'acudiente',
        'padremadre',
        'responsable',
        'representante'
      ]) ||
      ''
    ).trim()
  );

  // 4. Teléfono
  const telefono = limpiarTelefono(
    String(
      rawRow.telefono ||
      findVal(['telefono', 'celular', 'contacto', 'movil', 'telefonocontacto']) ||
      ''
    )
  );

  // 5. Dirección y Ubicación
  const direccion = repararTextoEspecial(
    String(
      rawRow.direccion ||
      findVal(['direccion', 'residencia', 'domicilio', 'direcion']) ||
      ''
    ).trim()
  );

  const ubicacion = repararTextoEspecial(
    String(
      rawRow.ubicacion ||
      findVal([
        'ubicacion',
        'sector',
        'barrio',
        'vereda',
        'zona',
        'municipio',
        'lugar'
      ]) ||
      'Calima El Darién'
    ).trim()
  );

  // 6. Lesiones Físicas
  const leciones_fisicas = repararTextoEspecial(
    String(
      rawRow.leciones_fisicas ||
      findVal([
        'lecionesfisicas',
        'lesionesfisicas',
        'lesiones',
        'saludfisica',
        'heridas',
        'golpes'
      ]) ||
      'Ninguna reportada'
    ).trim()
  );

  // 7. Salud Emocional
  const salud_emocional = repararTextoEspecial(
    String(
      rawRow.salud_emocional ||
      findVal([
        'saludemocional',
        'emocional',
        'psicologico',
        'afectacionemocional',
        'estadoanimo'
      ]) ||
      'Estable'
    ).trim()
  );

  // 8. Condición de la Vivienda
  const condicion_vivienda = repararTextoEspecial(
    String(
      rawRow.condicion_vivienda ||
      findVal([
        'condicionvivienda',
        'vivienda',
        'estadovivienda',
        'casa',
        'dañovivienda',
        'techo'
      ]) ||
      'Habitable'
    ).trim()
  );

  // 9. Ayuda Prioritaria Solicitada
  const ayuda_prioritaria = repararTextoEspecial(
    String(
      rawRow.ayuda_prioritaria ||
      findVal([
        'ayudaprioritaria',
        'ayudaurgente',
        'necesidad',
        'requerimiento',
        'tipoayuda'
      ]) ||
      'Alimentos no perecederos'
    ).trim()
  );

  // 10. Conectividad
  const conectividad = repararTextoEspecial(
    String(
      rawRow.conectividad ||
      findVal([
        'conectividad',
        'internet',
        'dispositivos',
        'computador',
        'accesoainternet',
        'senalinformatica'
      ]) ||
      'Conexión estable'
    ).trim()
  );

  // 11. Fecha del reporte
  const fecha_reporte = String(
    rawRow.fecha_reporte ||
    rawRow.created_at ||
    findVal(['fechareporte', 'marcafechahora', 'timestamp', 'fecha']) ||
    new Date().toISOString().split('T')[0]
  ).split('T')[0];

  // 12. ID único persistente
  const raw_db_id = rawRow.id !== undefined && rawRow.id !== null ? rawRow.id : undefined;
  const id = raw_db_id ? String(raw_db_id) : `gid_${index + 1}_${cleanKey(rawNombre).slice(0, 10)}`;

  // 13. Ayudas entregadas iniciales
  const ayudas_entregadas: AyudasContador = {
    Alimento: Number(rawRow.ayudas_alimento || rawRow.alimentos_entregados || 0),
    Medicamento: Number(rawRow.ayudas_medicamento || rawRow.medicamentos_entregados || 0),
    Ropa: Number(rawRow.ayudas_ropa || rawRow.ropa_entregada || 0),
    Emocional: Number(rawRow.ayudas_emocional || rawRow.emocional_entregado || 0),
    Construccion: Number(rawRow.ayudas_construccion || rawRow.construccion_entregada || 0)
  };

  const historial_ayudas: HistorialAyuda[] = [];

  // 14. Calcular nivel de urgencia diagnóstico
  const nivel_urgencia: NivelUrgencia = calcularUrgenciaAutomatica({
    leciones_fisicas,
    salud_emocional,
    condicion_vivienda,
    ayuda_prioritaria
  });

  return {
    id,
    fecha_reporte,
    nombre_estudiante: rawNombre,
    grado,
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

-- Habilitar RLS y otorgar permisos completos (SELECT, INSERT, UPDATE, DELETE) para anon y authenticated
ALTER TABLE public."Encuesta" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios anon en Encuesta" ON public."Encuesta";
CREATE POLICY "Permitir todo a usuarios anon en Encuesta" ON public."Encuesta"
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

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
DROP POLICY IF EXISTS "Permitir todo a usuarios anon en entregas_ayudas" ON public.entregas_ayudas;
CREATE POLICY "Permitir todo a usuarios anon en entregas_ayudas" ON public.entregas_ayudas
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. AGREGAR LLAVE PRIMARIA (ID ÚNICO FIJO) A UNA TABLA EXISTENTE:
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
ALTER TABLE public."Encuesta" ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
UPDATE public."Encuesta" SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE public."Encuesta" ALTER COLUMN id SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public."Encuesta"'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public."Encuesta" ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 4. CÓDIGO SQL PARA ELIMINAR REGISTROS DUPLICADOS POR NOMBRE EN SUPABASE:
-- (Conserva 1 solo registro por estudiante y borra las copias repetidas)
DELETE FROM public."Encuesta" a
USING public."Encuesta" b
WHERE a.ctid < b.ctid
  AND LOWER(TRIM(a.nombre_estudiante)) = LOWER(TRIM(b.nombre_estudiante))
  AND a.nombre_estudiante IS NOT NULL
  AND TRIM(a.nombre_estudiante) <> '';

-- 5. HABILITAR TIEMPO REAL (REALTIME) PARA ACTUALIZACIÓN EN VIVO MULTIUSUARIO:
ALTER TABLE public."Encuesta" REPLICA IDENTITY FULL;
ALTER TABLE public.entregas_ayudas REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."Encuesta";
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.entregas_ayudas;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
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

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, to);

      if (error) {
        // Reintentar en minúsculas si fue problema de mayúsculas
        const altTable = tableName === 'Encuesta' ? 'encuesta' : 'Encuesta';
        const retry = await supabase.from(altTable).select('*').range(from, to);
        if (!retry.error && retry.data) {
          allRows.push(...retry.data);
          hasMore = retry.data.length === PAGE_SIZE;
          from += PAGE_SIZE;
          to += PAGE_SIZE;
          continue;
        }
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

    // Mapear los registros reales traídos directamente de Supabase
    const estudiantes: EstudianteReporte[] = allRows.map((row, idx) =>
      normalizarEstudianteDesdeSupabase(row, idx)
    );

    // Cargar y unificar los eventos / entregas registradas en línea y en caché local
    try {
      const eventosCombinados: any[] = [];
      const idEventosVistos = new Set<string>();

      // 1. Cargar desde Supabase
      try {
        const { data: eventosRemotos, error: eventosError } = await supabase
          .from(EVENTS_TABLE_NAME)
          .select('*')
          .order('created_at', { ascending: false });

        if (!eventosError && Array.isArray(eventosRemotos)) {
          eventosRemotos.forEach((ev) => {
            if (ev && ev.id && !idEventosVistos.has(String(ev.id))) {
              idEventosVistos.add(String(ev.id));
              eventosCombinados.push(ev);
            }
          });
        }
      } catch (remErr) {
        console.warn('Aviso leyendo tabla remota entregas_ayudas:', remErr);
      }

      // 2. Cargar eventos locales
      const eventosLocales = obtenerEventosAyudaLocales();
      eventosLocales.forEach((ev) => {
        if (ev && ev.id && !idEventosVistos.has(String(ev.id))) {
          idEventosVistos.add(String(ev.id));
          eventosCombinados.push(ev);
        }
      });

      if (eventosCombinados.length > 0) {
        const studentMap = new Map<string, EstudianteReporte>();
        estudiantes.forEach((e) => {
          studentMap.set(e.id, e);
          studentMap.set(cleanKey(e.nombre_estudiante), e);
          if (e.raw_db_id) studentMap.set(String(e.raw_db_id), e);
          if (e.raw_nombre_original) studentMap.set(cleanKey(e.raw_nombre_original), e);
          studentMap.set(`${cleanKey(e.nombre_estudiante)}_${cleanKey(e.grado)}`, e);
        });

        eventosCombinados.forEach((ev: any) => {
          const target =
            studentMap.get(ev.estudiante_id) ||
            studentMap.get(cleanKey(ev.nombre_estudiante || '')) ||
            studentMap.get(`${cleanKey(ev.nombre_estudiante || '')}_${cleanKey(ev.grado || '')}`);

          if (target) {
            // Mapear y normalizar a 'Alimento' | 'Medicamento' | 'Ropa' | 'Emocional' | 'Construccion'
            const rawTipo = String(ev.tipo_ayuda || 'Alimento');
            const tipo: TipoAyuda = (mapearOpcionATipoAyuda(rawTipo) || rawTipo) as TipoAyuda;
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
            // Evitar duplicados en historial
            if (!target.historial_ayudas.some((h) => h.id === histItem.id)) {
              target.historial_ayudas.push(histItem);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Aviso procesando eventos de entregas de ayudas:', e);
    }

    return { data: estudiantes, error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Registra un evento de entrega en la tabla online adicional (entregas_ayudas) y en caché
 */
export async function registrarEventoAyudaEnSupabase(
  estudiante: EstudianteReporte,
  tipo: TipoAyuda,
  cantidad: number,
  fecha: string,
  responsable: string,
  observaciones: string
): Promise<{ success: boolean; id: string; error: any }> {
  const tipoNormalizado = (mapearOpcionATipoAyuda(tipo) || tipo) as TipoAyuda;
  const eventId = `ayuda_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    id: eventId,
    estudiante_id: estudiante.id,
    nombre_estudiante: estudiante.nombre_estudiante,
    grado: estudiante.grado,
    tipo_ayuda: tipoNormalizado,
    cantidad,
    fecha: fecha || new Date().toISOString().split('T')[0],
    responsable: responsable || 'Comité Gidelca',
    observaciones: observaciones || ''
  };

  // 1. Guardar siempre de forma inmediata en la caché local
  guardarEventoAyudaLocalmente(payload);

  // 2. Sincronizar en Supabase
  try {
    const { error } = await supabase.from(EVENTS_TABLE_NAME).insert([payload]);

    if (error) {
      console.warn('Aviso guardando evento en tabla entregas_ayudas de Supabase:', error.message);
      return { success: false, id: eventId, error };
    }

    return { success: true, id: eventId, error: null };
  } catch (err) {
    console.warn('Fallo de red guardando evento en Supabase:', err);
    return { success: false, id: eventId, error: err };
  }
}

/**
 * Elimina un evento de entrega de ayuda en Supabase y en la caché local
 */
export async function eliminarEventoAyudaEnSupabase(
  eventoId: string
): Promise<{ success: boolean; error: any }> {
  // 1. Eliminar de la caché local inmediatamente
  eliminarEventoAyudaLocalmente(eventoId);

  // 2. Eliminar de Supabase
  try {
    const { error } = await supabase
      .from(EVENTS_TABLE_NAME)
      .delete()
      .eq('id', eventoId);

    if (error) {
      console.warn('Aviso eliminando evento en entregas_ayudas:', error.message);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('Fallo eliminando evento en Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Detecta las columnas reales que existen en la tabla de Supabase para mapear el payload
 */
async function obtenerColumnasTabla(tableName: string): Promise<string[]> {
  try {
    const { data } = await supabase.from(tableName).select('*').limit(1);
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
  } catch {}
  return [];
}

/**
 * Construye el payload adaptándose dinámicamente a las columnas existentes en Supabase
 */
function construirPayloadAdaptado(
  estudiante: EstudianteReporte,
  columnasExistentes: string[]
): Record<string, any> {
  // Si no se detectaron columnas (tabla vacía o error), usar formato estándar
  if (columnasExistentes.length === 0) {
    const fallback: Record<string, any> = {
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
      ayuda_prioritaria: estudiante.ayuda_prioritaria || 'Alimentos no perecederos',
      conectividad: estudiante.conectividad || 'Conexión estable'
    };
    if (estudiante.raw_db_id) {
      fallback.id = estudiante.raw_db_id;
    }
    return fallback;
  }

  const payload: Record<string, any> = {};

  const mapToCol = (keywords: string[], value: any) => {
    for (const kw of keywords) {
      const cleanKw = cleanKey(kw);
      // Coincidencia exacta
      const exact = columnasExistentes.find((c) => cleanKey(c) === cleanKw);
      if (exact) {
        payload[exact] = value;
        return;
      }
      // Coincidencia parcial
      const partial = columnasExistentes.find((c) => cleanKey(c).includes(cleanKw));
      if (partial) {
        payload[partial] = value;
        return;
      }
    }
  };

  mapToCol(['nombre_estudiante', 'nombres_y_apellidos', 'nombre_completo', 'nombre', 'estudiante'], estudiante.nombre_estudiante);
  mapToCol(['grado', 'grado_y_grupo', 'grupo', 'curso'], estudiante.grado);
  mapToCol(['nombre_acudiente', 'acudiente', 'padremadre', 'responsable'], estudiante.nombre_acudiente || '');
  mapToCol(['telefono', 'celular', 'contacto', 'movil'], estudiante.telefono || '');
  mapToCol(['direccion', 'residencia', 'domicilio'], estudiante.direccion || '');
  mapToCol(['ubicacion', 'sector', 'barrio', 'vereda', 'zona'], estudiante.ubicacion || 'Calima El Darién');
  mapToCol(['leciones_fisicas', 'lesiones', 'salud_fisica', 'heridas'], estudiante.leciones_fisicas || 'No');
  mapToCol(['salud_emocional', 'emocional', 'psicologico', 'estado_animo'], estudiante.salud_emocional || 'Estable');
  mapToCol(['condicion_vivienda', 'vivienda', 'estado_vivienda', 'casa'], estudiante.condicion_vivienda || 'Habitable');
  mapToCol(['ayuda_prioritaria', 'ayuda_urgente', 'necesidad', 'tipo_ayuda'], estudiante.ayuda_prioritaria || 'Alimentos no perecederos');
  mapToCol(['conectividad', 'internet', 'dispositivos'], estudiante.conectividad || 'Conexión estable');
  mapToCol(['fecha_reporte', 'fecha', 'marca_temporal', 'timestamp'], estudiante.fecha_reporte || new Date().toISOString().split('T')[0]);

  // Manejo de ID sólo si existe en las columnas y es un id válido
  const idCol = columnasExistentes.find((c) => cleanKey(c) === 'id');
  if (idCol && estudiante.raw_db_id) {
    payload[idCol] = estudiante.raw_db_id;
  }

  return payload;
}

/**
 * Guarda o actualiza un estudiante en la tabla principal (Encuesta)
 */
export async function guardarEstudianteEnSupabase(
  estudiante: EstudianteReporte,
  tableName = DEFAULT_TABLE_NAME
): Promise<{ success: boolean; error: any; message?: string }> {
  try {
    // Si estaba previamente marcado como eliminado, removerlo de la lista negra
    desmarcarEstudianteEliminado(estudiante.id);
    desmarcarEstudianteEliminado(cleanKey(estudiante.nombre_estudiante));
    if (estudiante.raw_db_id) {
      desmarcarEstudianteEliminado(String(estudiante.raw_db_id));
    }

    const targetTables = [tableName, tableName === 'Encuesta' ? 'encuesta' : 'Encuesta'];

    for (const tbl of targetTables) {
      const columnas = await obtenerColumnasTabla(tbl);
      const payload = construirPayloadAdaptado(estudiante, columnas);

      // 1. Si el estudiante ya tiene un ID de base de datos o nombre previo, intentar UPDATE primero
      const idCol = columnas.find((c) => cleanKey(c) === 'id');
      const nameCol = columnas.find((c) =>
        ['nombreestudiante', 'nombredelestudiante', 'nombresyapellidosdelestudiante', 'nombre'].includes(cleanKey(c))
      );

      if (estudiante.raw_db_id && idCol) {
        const updateRes = await supabase.from(tbl).update(payload).eq(idCol, estudiante.raw_db_id);
        if (!updateRes.error) {
          return { success: true, error: null, message: 'Estudiante actualizado en Supabase' };
        }
      }

      if (nameCol && (estudiante.raw_nombre_original || estudiante.nombre_estudiante)) {
        const targetName = estudiante.raw_nombre_original || estudiante.nombre_estudiante;
        const updateByName = await supabase.from(tbl).update(payload).ilike(nameCol, targetName);
        if (!updateByName.error && updateByName.data) {
          return { success: true, error: null, message: 'Estudiante actualizado en Supabase' };
        }
      }

      // 2. Si es nuevo o no se actualizó, hacer INSERT
      const insertRes = await supabase.from(tbl).insert([payload]);
      if (!insertRes.error) {
        return { success: true, error: null, message: 'Estudiante creado en Supabase' };
      }

      // Si falló por RLS, retornar error explícito
      if (insertRes.error.code === '42501' || insertRes.error.message.includes('row-level security')) {
        return {
          success: false,
          error: insertRes.error,
          message: 'Error de permisos RLS en Supabase. Ejecuta el script SQL en Supabase para autorizar escrituras.'
        };
      }
    }

    return {
      success: false,
      error: new Error('No se pudo guardar en Supabase'),
      message: 'No se pudo insertar en la tabla de Supabase. Verifique las columnas o políticas RLS.'
    };
  } catch (err: any) {
    console.warn('Fallo guardando estudiante en Supabase:', err);
    return { success: false, error: err, message: err?.message || 'Error de conexión' };
  }
}

/**
 * Elimina un estudiante permanentemente de la base de datos y de la sesión local
 */
export async function eliminarEstudianteEnSupabase(
  estudiante: EstudianteReporte,
  tableName = DEFAULT_TABLE_NAME
): Promise<{ success: boolean; error: any; message?: string }> {
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

    let deletedAtLeastOnce = false;
    let rlsError: any = null;

    for (const tbl of targetTables) {
      const columnas = await obtenerColumnasTabla(tbl);

      // 1. Borrar por raw_db_id si la columna 'id' existe
      const idCol = columnas.find((c) => cleanKey(c) === 'id');
      if (idCol && estudiante.raw_db_id) {
        try {
          const res = await supabase.from(tbl).delete().eq(idCol, estudiante.raw_db_id);
          if (!res.error) deletedAtLeastOnce = true;
          else if (res.error.code === '42501') rlsError = res.error;
        } catch {}
      }

      // 2. Borrar por columnas de nombre
      const nameColumns = columnas.filter((c) => {
        const k = cleanKey(c);
        return (
          k.includes('nombre') ||
          k.includes('estudiante') ||
          k.includes('alumno')
        );
      });

      const colsToTry = nameColumns.length > 0 ? nameColumns : ['nombre_estudiante', 'Nombre del estudiante', 'nombre'];

      for (const col of colsToTry) {
        for (const nameVal of nameVariants) {
          try {
            const res = await supabase.from(tbl).delete().ilike(col, nameVal);
            if (!res.error) deletedAtLeastOnce = true;
            else if (res.error.code === '42501') rlsError = res.error;
          } catch {}
        }
      }
    }

    // También borrar entregas_ayudas registradas para este estudiante
    try {
      await supabase.from(EVENTS_TABLE_NAME).delete().eq('estudiante_id', estudiante.id);
      await supabase.from(EVENTS_TABLE_NAME).delete().ilike('nombre_estudiante', estudiante.nombre_estudiante);
    } catch {}

    if (rlsError && !deletedAtLeastOnce) {
      return {
        success: false,
        error: rlsError,
        message: 'Aviso: La eliminación en Supabase fue bloqueada por políticas RLS. El estudiante fue eliminado localmente.'
      };
    }

    return { success: true, error: null, message: 'Estudiante eliminado exitosamente' };
  } catch (err: any) {
    console.warn('Error borrando en Supabase:', err);
    return { success: false, error: err, message: err?.message };
  }
}

/**
 * Alias exportado para calcular el nivel de urgencia diagnóstica
 */
export function calcularNivelUrgencia(data: {
  leciones_fisicas?: string;
  salud_emocional?: string;
  condicion_vivienda?: string;
  ayuda_prioritaria?: string;
}): NivelUrgencia {
  return calcularUrgenciaAutomatica(data);
}

/**
 * Calcula el nivel de urgencia diagnóstica automáticamente
 */
function calcularUrgenciaAutomatica(data: {
  leciones_fisicas?: string;
  salud_emocional?: string;
  condicion_vivienda?: string;
  ayuda_prioritaria?: string;
}): NivelUrgencia {
  const fisica = (data.leciones_fisicas || '').toLowerCase();
  const emocional = (data.salud_emocional || '').toLowerCase();
  const vivienda = (data.condicion_vivienda || '').toLowerCase();
  const ayuda = (data.ayuda_prioritaria || '').toLowerCase();

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

/**
 * Detecta y elimina automáticamente registros duplicados por nombre en Supabase
 */
export async function depurarDuplicadosSupabase(
  tableName: string = DEFAULT_TABLE_NAME
): Promise<{ success: boolean; eliminadosCount: number; message: string }> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error || !data || data.length === 0) {
      return {
        success: false,
        eliminadosCount: 0,
        message: error ? error.message : 'No se encontraron registros para depurar.'
      };
    }

    // Identificar la clave de nombre
    const sample = data[0];
    const nameCol =
      Object.keys(sample).find((k) => {
        const c = cleanKey(k);
        return c.includes('nombre') || c.includes('estudiante') || c.includes('alumno');
      }) || 'nombre_estudiante';

    // Agrupar por nombre normalizado
    const grupos = new Map<string, any[]>();
    data.forEach((row) => {
      const rawName = String(row[nameCol] || '').trim();
      const normKey = cleanKey(rawName);
      if (!normKey) return;

      if (!grupos.has(normKey)) {
        grupos.set(normKey, []);
      }
      grupos.get(normKey)!.push(row);
    });

    const idsParaEliminar: any[] = [];

    grupos.forEach((filas) => {
      if (filas.length > 1) {
        // Conservar el primer elemento y marcar los demás para eliminación
        const duplicados = filas.slice(1);
        duplicados.forEach((dup) => {
          if (dup.id !== undefined && dup.id !== null) {
            idsParaEliminar.push(dup.id);
          }
        });
      }
    });

    if (idsParaEliminar.length === 0) {
      return {
        success: true,
        eliminadosCount: 0,
        message: '¡Excelente! No se encontraron registros con nombres duplicados.'
      };
    }

    // Ejecutar eliminación en lotes por ID
    let eliminadosTotal = 0;
    const CHUNK_SIZE = 40;
    for (let i = 0; i < idsParaEliminar.length; i += CHUNK_SIZE) {
      const chunk = idsParaEliminar.slice(i, i + CHUNK_SIZE);
      const { error: delErr } = await supabase
        .from(tableName)
        .delete()
        .in('id', chunk);

      if (!delErr) {
        eliminadosTotal += chunk.length;
      } else {
        console.warn('Aviso eliminando lote de duplicados:', delErr.message);
      }
    }

    return {
      success: true,
      eliminadosCount: eliminadosTotal,
      message: `Se eliminaron ${eliminadosTotal} registros duplicados de la tabla "${tableName}" con éxito.`
    };
  } catch (err: any) {
    return {
      success: false,
      eliminadosCount: 0,
      message: `Error al depurar duplicados: ${err?.message || err}`
    };
  }
}

/**
 * Se suscribe a los cambios en tiempo real de Supabase (INSERT, UPDATE, DELETE)
 * para sincronizar a todos los docentes conectados de manera instantánea
 */
export function suscribirCambiosEnVivo(
  tableName: string,
  onLiveChange: (payload: { eventType: string; table: string; new?: any; old?: any }) => void
): () => void {
  const channelId = `live-sync-${Math.random().toString(36).substring(2, 8)}`;
  const tables = Array.from(
    new Set([
      tableName,
      tableName === 'Encuesta' ? 'encuesta' : 'Encuesta',
      EVENTS_TABLE_NAME
    ])
  );

  let channel = supabase.channel(channelId);

  tables.forEach((tbl) => {
    channel = channel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: tbl
      },
      (payload: any) => {
        onLiveChange({
          eventType: payload.eventType,
          table: tbl,
          new: payload.new,
          old: payload.old
        });
      }
    );
  });

  channel.subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      console.warn('Aviso cancelando canal realtime:', e);
    }
  };
}
