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
  ArrowRight
} from 'lucide-react';
import {
  supabase,
  SUPABASE_URL,
  DEFAULT_TABLE_NAME,
  SUPABASE_SCHEMA_SQL,
  cargarTodosLosEstudiantesSupabase,
  parsearCSVGoogleForms
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
  const [currentTable, setCurrentTable] = useState(tableName || DEFAULT_TABLE_NAME);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [copied, setCopied] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [totalRemoteCount, setTotalRemoteCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
            `La tabla "${tableToTest}" no existe en el proyecto Supabase actual. Verifica el nombre exacto de tu tabla o importa el archivo CSV de Google Forms directamente.`
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-400 text-emerald-950">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Sincronización de Base de Datos • Google Forms & Supabase
              </h2>
              <p className="text-xs text-emerald-200">
                Gimnasio del Calima (1,270+ registros censados)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-200 ${
                statusType === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusType === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-900'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusType === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-bold leading-relaxed">{statusMessage}</p>
                {totalRemoteCount !== null && (
                  <p className="text-[11px] opacity-90">
                    Total en base de datos: <strong>{totalRemoteCount} estudiantes</strong>
                  </p>
                )}
                {detectedColumns.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60">
                    <p className="text-[10px] uppercase font-black tracking-wider text-emerald-800">
                      Columnas detectadas:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detectedColumns.map((col) => (
                        <span
                          key={col}
                          className="px-1.5 py-0.5 rounded bg-white text-emerald-900 border border-emerald-200 font-mono text-[10px]"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Opción 1: Carga directa desde Supabase */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-emerald-700" />
                1. Sincronizar desde Tabla Supabase:
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                URL: {SUPABASE_URL.replace('https://', '').split('.')[0]}...
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={currentTable}
                onChange={(e) => setCurrentTable(e.target.value)}
                placeholder="Nombre de la tabla (ej. reportes_gidelca, estudiantes...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => handleTestAndInspect(currentTable)}
                disabled={loading}
                className="px-3 py-2 rounded-xl font-black bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Probar
              </button>
              <button
                type="button"
                onClick={handlePullAllFromSupabase}
                disabled={loading}
                className="px-4 py-2 rounded-xl font-black bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                Cargar
              </button>
            </div>

            {/* Sugerencias de tablas */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
              <span>Tabla censo:</span>
              {['Encuesta', 'encuesta', 'reportes_gidelca', 'estudiantes'].map((tbl) => (
                <button
                  key={tbl}
                  type="button"
                  onClick={() => {
                    setCurrentTable(tbl);
                    handleTestAndInspect(tbl);
                  }}
                  className={`px-2.5 py-1 rounded-xl border font-mono text-[11px] font-black transition-colors cursor-pointer ${
                    currentTable === tbl
                      ? 'bg-[#15803D] text-white border-[#15803D] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>
          </div>

          {/* Opción 2: Importar archivo CSV/Excel de Google Forms */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                2. Importar Respuestas de Google Forms (.CSV / Excel):
              </label>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              Si tienes el archivo de respuestas de Google Forms descargado en tu computador (los 1,270 registros), puedes importarlo directamente aquí:
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-input"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>Seleccionar archivo CSV de Google Forms (1,270 Estudiantes)</span>
            </button>
          </div>

          {/* Script SQL opcional */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-[11px]">
                <Code className="w-4 h-4 text-emerald-700" />
                <span>Script SQL para Supabase (Opcional)</span>
              </div>
              <button
                onClick={copySql}
                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-black text-slate-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-28">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Estudiantes cargados en memoria: <strong>{estudiantes.length}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
