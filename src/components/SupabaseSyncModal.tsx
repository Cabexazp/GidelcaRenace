import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  Code,
  Table,
  Sparkles,
  FileSpreadsheet,
  Upload,
  ArrowRight,
  Globe,
  Key,
  ShieldCheck,
  Layers,
  HelpCircle,
  Trash2
} from 'lucide-react';
import {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  DEFAULT_TABLE_NAME,
  SUPABASE_SCHEMA_SQL,
  cargarTodosLosEstudiantesSupabase,
  guardarEstudianteEnSupabase,
  eliminarEstudianteEnSupabase,
  depurarDuplicadosSupabase,
  parsearCSVGoogleForms,
  actualizarCredencialesSupabase,
  getSupabaseUrl,
  getSupabaseAnonKey
} from '../lib/supabase';
import { EstudianteReporte } from '../types';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  estudiantes: EstudianteReporte[];
  tableName: string;
  onTableNameChange: (name: string) => void;
  onClose: () => void;
  onUpdateEstudiantesFromSupabase: (remoteList: EstudianteReporte[]) => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  estudiantes,
  tableName,
  onTableNameChange,
  onClose,
  onUpdateEstudiantesFromSupabase
}) => {
  const [activeTab, setActiveTab] = useState<'tabla' | 'vercel' | 'sql'>('tabla');
  const [currentTable, setCurrentTable] = useState(tableName || DEFAULT_TABLE_NAME);
  const [customUrl, setCustomUrl] = useState(getSupabaseUrl());
  const [customKey, setCustomKey] = useState(getSupabaseAnonKey());
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [copied, setCopied] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [totalRemoteCount, setTotalRemoteCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSaveCredentials = () => {
    try {
      actualizarCredencialesSupabase(customUrl, customKey);
      setStatusType('success');
      setStatusMessage('¡Credenciales de Supabase actualizadas correctamente! Ahora puedes probar la conexión.');
    } catch (e: any) {
      setStatusType('error');
      setStatusMessage(`Error guardando credenciales: ${e?.message || e}`);
    }
  };

  const handleTestAndInspect = async (tableToTest: string) => {
    setLoading(true);
    setStatusMessage(`Consultando tabla "${tableToTest}" en Supabase...`);
    setStatusType('info');
    setDetectedColumns([]);
    setTotalRemoteCount(null);

    try {
      const { data, count, error } = await supabase
        .from(tableToTest)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setStatusType('error');
          setStatusMessage(
            `La tabla "${tableToTest}" no existe en el proyecto Supabase actual. Verifica el nombre exacto (ej: Encuesta o encuesta) o revisa la pestaña de SQL.`
          );
        } else if (error.code === '42501' || error.message.includes('row-level security')) {
          setStatusType('error');
          setStatusMessage(
            `⚠️ Error de permisos RLS en Supabase: La tabla tiene Row Level Security habilitado sin permisos para anon. Copia y ejecuta el script SQL de la pestaña "Script SQL & RLS" en Supabase.`
          );
        } else {
          setStatusType('error');
          setStatusMessage(`Respuesta de Supabase (${error.code || 'Desconocido'}): ${error.message}`);
        }
      } else {
        const rowCount = count !== null ? count : data?.length || 0;
        setTotalRemoteCount(rowCount);
        if (data && data.length > 0) {
          const cols = Object.keys(data[0]);
          setDetectedColumns(cols);
        }

        setStatusType('success');
        setStatusMessage(
          `¡Conexión exitosa! Se encontraron ${rowCount} registros en la tabla "${tableToTest}".`
        );
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(`Error de red o conexión: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWriteAndDelete = async () => {
    setLoading(true);
    setStatusMessage('Ejecutando diagnóstico en Supabase: probando INSERT y DELETE...');
    setStatusType('info');

    const testStudent: EstudianteReporte = {
      id: `test_${Date.now()}`,
      fecha_reporte: new Date().toISOString().split('T')[0],
      nombre_estudiante: 'PRUEBA_VERIFICACION_GIDELCA',
      grado: '11-1',
      nombre_acudiente: 'Comite Verificacion',
      telefono: '3001234567',
      direccion: 'Calima',
      ubicacion: 'Calima El Darién',
      leciones_fisicas: 'Ninguna',
      salud_emocional: 'Estable',
      condicion_vivienda: 'Habitable',
      ayuda_prioritaria: 'Alimentos',
      conectividad: 'Buena',
      nivel_urgencia: 'verde',
      ayudas_entregadas: { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 },
      historial_ayudas: []
    };

    try {
      // 1. Probar Crear / Insertar
      const saveRes = await guardarEstudianteEnSupabase(testStudent, currentTable);
      if (!saveRes.success) {
        setStatusType('error');
        setStatusMessage(
          `❌ Falló la creación en Supabase: ${saveRes.message || saveRes.error?.message}. Causa común: Falta la política de RLS para INSERT en Supabase.`
        );
        setLoading(false);
        return;
      }

      // 2. Probar Eliminar / Borrar
      const delRes = await eliminarEstudianteEnSupabase(testStudent, currentTable);
      if (!delRes.success) {
        setStatusType('error');
        setStatusMessage(
          `⚠️ Se pudo crear el registro pero falló la eliminación: ${delRes.message || delRes.error?.message}. Causa común: Falta la política de RLS para DELETE en Supabase.`
        );
        setLoading(false);
        return;
      }

      setStatusType('success');
      setStatusMessage(
        '✅ ¡Prueba de Escritura y Eliminación exitosa! Supabase permite tanto crear nuevos estudiantes como eliminarlos correctamente.'
      );
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(`❌ Error en la prueba: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePullAllFromSupabase = async () => {
    setLoading(true);
    setStatusMessage(`Cargando registros desde la tabla "${currentTable}" en Supabase...`);
    setStatusType('info');

    try {
      const { data, error } = await cargarTodosLosEstudiantesSupabase(currentTable);

      if (error) {
        setStatusType('error');
        setStatusMessage(`Error al cargar datos: ${error.message}`);
      } else if (data.length === 0) {
        setStatusType('info');
        setStatusMessage(
          `La tabla "${currentTable}" no devolvió registros. Si descargaste el Excel/CSV de Google Forms, puedes subirlo con el botón de Importar CSV.`
        );
      } else {
        onTableNameChange(currentTable);
        onUpdateEstudiantesFromSupabase(data);
        setStatusType('success');
        setStatusMessage(
          `¡Sincronización completada! Se cargaron ${data.length} estudiantes reales de tu base de datos.`
        );
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(`Error inesperado: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeduplicate = async () => {
    if (
      !window.confirm(
        `¿Deseas buscar y eliminar los registros duplicados con el mismo nombre en la tabla "${currentTable}" de Supabase? Se mantendrá 1 registro único por estudiante.`
      )
    ) {
      return;
    }

    setLoading(true);
    setStatusMessage(`Buscando y depurando registros duplicados en la tabla "${currentTable}"...`);
    setStatusType('info');

    try {
      const res = await depurarDuplicadosSupabase(currentTable);
      if (res.success) {
        setStatusType('success');
        setStatusMessage(res.message);
        // Recargar datos actualizados
        const { data } = await cargarTodosLosEstudiantesSupabase(currentTable);
        if (data && data.length > 0) {
          onUpdateEstudiantesFromSupabase(data);
        }
      } else {
        setStatusType('error');
        setStatusMessage(res.message);
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(`Error depurando duplicados: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar importación directa de CSV de Google Forms
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(`Procesando archivo ${file.name}...`);
    setStatusType('info');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('Archivo vacío');
        }

        const estudiantesImportados = parsearCSVGoogleForms(text);
        if (estudiantesImportados.length === 0) {
          throw new Error('No se pudieron extraer filas válidas del archivo CSV.');
        }

        onUpdateEstudiantesFromSupabase(estudiantesImportados);
        setStatusType('success');
        setStatusMessage(
          `¡Éxito! Se importaron ${estudiantesImportados.length} estudiantes del archivo Google Forms.`
        );
      } catch (err: any) {
        setStatusType('error');
        setStatusMessage(`Error al procesar CSV: ${err?.message || err}`);
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setStatusType('error');
      setStatusMessage('Error leyendo el archivo en el navegador.');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const vercelEnvSnippet = `VITE_SUPABASE_URL=${customUrl}
VITE_SUPABASE_ANON_KEY=${customKey}`;

  const copyVercelEnv = () => {
    navigator.clipboard.writeText(vercelEnvSnippet);
    setCopiedVercel(true);
    setTimeout(() => setCopiedVercel(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-400 text-emerald-950">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Sincronización con Supabase & Vercel
              </h2>
              <p className="text-xs text-emerald-200">
                Gimnasio del Calima • GidelcaRenace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 text-xs font-black">
          <button
            onClick={() => setActiveTab('tabla')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'tabla'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>1. Tabla y Censo</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'vercel'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>2. Guía Vercel & Guardado</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'sql'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>3. Script SQL & Permisos RLS</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Mensaje de estado dinámico */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                statusType === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusType === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusType === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {statusType === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
              <span className="font-semibold">{statusMessage}</span>
            </div>
          )}

          {/* TAB 1: TABLA Y CENSO */}
          {activeTab === 'tabla' && (
            <div className="space-y-5">
              {/* Sección 1: Nombre de la Tabla en Supabase */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-700" />
                    Nombre de la Tabla en Supabase:
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">Por defecto: Encuesta</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTable}
                    onChange={(e) => setCurrentTable(e.target.value)}
                    placeholder="Ej: Encuesta o encuesta"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    onClick={() => handleTestAndInspect(currentTable)}
                    disabled={loading}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Probar Tabla</span>
                  </button>
                  <button
                    onClick={handleTestWriteAndDelete}
                    disabled={loading}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    title="Ejecutar prueba de crear y eliminar un registro en Supabase"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Probar Guardar/Eliminar</span>
                  </button>
                </div>

                {detectedColumns.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Columnas detectadas en Supabase:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {detectedColumns.map((col) => (
                        <span
                          key={col}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-emerald-950"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 2: Cargar datos desde Supabase */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-emerald-950 text-sm flex items-center gap-2">
                    <DownloadCloud className="w-4 h-4 text-emerald-700" />
                    <span>Cargar Censo desde Supabase a la Aplicación</span>
                  </h3>
                </div>
                <p className="text-slate-600 font-medium">
                  Descarga todas las respuestas de la tabla seleccionada y actualiza el directorio escolar en tiempo real.
                </p>
                <button
                  onClick={handlePullAllFromSupabase}
                  disabled={loading}
                  className="w-full py-3 bg-[#15803D] hover:bg-emerald-800 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sincronizar y Cargar Estudiantes de Supabase</span>
                </button>
              </div>

              {/* Sección 3: Importar CSV de Google Forms */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-amber-950 text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                    <span>Importar Archivo CSV Directo (Google Forms)</span>
                  </h3>
                </div>
                <p className="text-slate-600 font-medium">
                  Si descargaste el archivo .CSV de las respuestas de Google Forms, súbelo aquí para importar todos los registros automáticamente.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivo CSV de Google Forms</span>
                </button>
              </div>

              {/* Sección 4: Depurar Duplicados */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-rose-950 text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-700" />
                    <span>Depurar y Eliminar Registros con Nombres Duplicados</span>
                  </h3>
                </div>
                <p className="text-slate-600 font-medium text-xs">
                  Si un estudiante diligenció la encuesta más de una vez en Google Forms o Supabase, este botón conserva 1 solo registro único y elimina todas las filas duplicadas directamente en Supabase.
                </p>
                <button
                  onClick={handleDeduplicate}
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>Eliminar Duplicados en Supabase Ahora</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GUÍA VERCEL & PERSISTENCIA */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <h3 className="font-black text-emerald-950 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-700" />
                  <span>¿Por qué no guardaba al desplegar en Vercel?</span>
                </h3>
                <p className="text-slate-700 font-medium leading-relaxed">
                  Para que las aplicaciones Vite guarden en Supabase desde Vercel se requieren dos pasos clave:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-800 font-semibold pl-1">
                  <li>
                    <strong>Variables con prefijo <code className="bg-white px-1.5 py-0.5 rounded text-emerald-800 font-mono">VITE_</code>:</strong> En Vercel se deben configurar <code className="bg-white px-1 py-0.5 rounded text-emerald-800 font-mono">VITE_SUPABASE_URL</code> y <code className="bg-white px-1 py-0.5 rounded text-emerald-800 font-mono">VITE_SUPABASE_ANON_KEY</code>.
                  </li>
                  <li>
                    <strong>Permisos RLS en Supabase:</strong> Si la tabla tiene Row Level Security (RLS) activo, Supabase bloquea los <code className="bg-white px-1 py-0.5 rounded font-mono">INSERT</code> y <code className="bg-white px-1 py-0.5 rounded font-mono">UPDATE</code> del rol <code className="font-mono">anon</code> a menos que se aplique la política de la pestaña 3.
                  </li>
                </ol>
              </div>

              {/* Configuración rápida de credenciales en navegador */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-700" />
                  Configurar Credenciales de Supabase en esta Sesión:
                </h4>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Supabase Project URL:
                    </label>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://xxxx.supabase.co"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      Supabase Anon Public API Key:
                    </label>
                    <input
                      type="text"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="eyJhbGciOi..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveCredentials}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl transition-all shadow-xs cursor-pointer text-center"
                  >
                    Guardar y Conectar
                  </button>
                  <button
                    onClick={copyVercelEnv}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    title="Copiar formato para Vercel Environment Variables"
                  >
                    {copiedVercel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVercel ? '¡Copiado!' : 'Copiar para Vercel'}</span>
                  </button>
                </div>
              </div>

              {/* Pasos en Vercel */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-2 text-[11px]">
                <span className="text-yellow-400 font-black uppercase text-[10px] tracking-wider block">
                  Pasos para configurar en Vercel Dashboard:
                </span>
                <p>1. Ve a tu proyecto en <strong>vercel.com</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong>.</p>
                <p>2. Agrega la variable <strong><code className="text-yellow-300">VITE_SUPABASE_URL</code></strong> con tu URL de Supabase.</p>
                <p>3. Agrega la variable <strong><code className="text-yellow-300">VITE_SUPABASE_ANON_KEY</code></strong> con tu clave anon de Supabase.</p>
                <p>4. Haz clic en <strong>Redeploy</strong> para aplicar los cambios.</p>
              </div>
            </div>
          )}

          {/* TAB 3: SCRIPT SQL & RLS */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Script SQL para Habilitar Guardado y Permisos en Supabase
                  </h3>
                  <p className="text-slate-500 font-medium">
                    Ejecuta este código en el <strong>SQL Editor</strong> de Supabase para permitir guardar y editar sin bloqueos RLS.
                  </p>
                </div>
                <button
                  onClick={copySql}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-yellow-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed max-h-72">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={handleDeduplicate}
                  disabled={loading}
                  className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>Depurar Duplicados en Supabase</span>
                </button>
                <button
                  onClick={handleTestWriteAndDelete}
                  disabled={loading}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-yellow-300" />
                  <span>Verificar Permisos de Escritura y Eliminación</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Estado de conexión: <strong>{estudiantes.length} estudiantes en memoria</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
