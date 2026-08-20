import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  Printer,
  ChevronDown
} from 'lucide-react';
import { EstudianteReporte } from '../types';
import { ordenarGradosEscolares } from '../lib/supabase';
import { exportarReporteExcel, exportarReportePDF } from '../lib/exportReports';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  estudiantes: EstudianteReporte[];
  initialGrade?: string;
  onNotify?: (msg: string) => void;
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  estudiantes,
  initialGrade = 'Todos',
  onNotify
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Grados únicos ordenados
  const uniqueGrades = useMemo(() => {
    const grades = Array.from(new Set(estudiantes.map((e) => e.grado))).filter(Boolean) as string[];
    return ordenarGradosEscolares(grades);
  }, [estudiantes]);

  // Actualizar si cambia initialGrade al abrir
  React.useEffect(() => {
    if (isOpen) {
      setSelectedGrade(initialGrade || 'Todos');
    }
  }, [isOpen, initialGrade]);

  if (!isOpen) return null;

  const esGeneral = selectedGrade === 'Todos';

  const filteredStudents = esGeneral
    ? estudiantes
    : estudiantes.filter((e) => e.grado === selectedGrade);

  // Métricas del grupo a exportar
  const totalCriticos = filteredStudents.filter((e) => e.nivel_urgencia === 'rojo').length;
  const totalAlerta = filteredStudents.filter((e) => e.nivel_urgencia === 'naranja').length;
  const totalEstables = filteredStudents.filter((e) => e.nivel_urgencia === 'verde').length;

  const totalAyudas = filteredStudents.reduce((acc, e) => {
    const a = e.ayudas_entregadas || {
      Alimento: 0,
      Medicamento: 0,
      Ropa: 0,
      Emocional: 0,
      Construccion: 0
    };
    return acc + (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0);
  }, 0);

  // Manejar descarga Excel
  const handleDownloadExcel = async (gradeToExport = selectedGrade) => {
    setIsExportingExcel(true);
    try {
      await exportarReporteExcel(estudiantes, {
        grado: gradeToExport,
        tituloInstitucion: 'Gimnasio del Calima'
      });
      if (onNotify) {
        onNotify(
          `📊 Reporte Excel generado (${
            gradeToExport === 'Todos' ? 'General' : `Grado ${gradeToExport}`
          }) con ${
            gradeToExport === 'Todos'
              ? estudiantes.length
              : estudiantes.filter((e) => e.grado === gradeToExport).length
          } estudiantes.`
        );
      }
    } catch (err) {
      console.error('Error exportando Excel:', err);
      if (onNotify) onNotify('Error al generar el archivo Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Manejar descarga PDF
  const handleDownloadPDF = (gradeToExport = selectedGrade) => {
    setIsExportingPDF(true);
    try {
      exportarReportePDF(estudiantes, {
        grado: gradeToExport,
        tituloInstitucion: 'Gimnasio del Calima'
      });
      if (onNotify) {
        onNotify(
          `📄 Reporte PDF oficial generado (${
            gradeToExport === 'Todos' ? 'General' : `Grado ${gradeToExport}`
          }). Listo para imprimir.`
        );
      }
    } catch (err) {
      console.error('Error exportando PDF:', err);
      if (onNotify) onNotify('Error al generar el archivo PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="export-reports-modal"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#15803D] via-emerald-800 to-emerald-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400 text-emerald-950 rounded-2xl font-black shadow-md">
              <Download className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-yellow-300 uppercase">
                Centro de Descargas Oficial
              </span>
              <h3 className="text-xl font-black tracking-tight text-white">
                Descargar Reportes en Excel y PDF
              </h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                Exporta el censo general consolidado o genera reportes independientes por grado escolar.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Selector de Grado o General */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              1. Seleccione el Alcance del Reporte:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedGrade('Todos')}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedGrade === 'Todos'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className={`w-4 h-4 ${selectedGrade === 'Todos' ? 'text-yellow-300' : 'text-emerald-700'}`} />
                  <div>
                    <div className="text-xs font-black">Reporte General Consolidado</div>
                    <div className={`text-[10px] ${selectedGrade === 'Todos' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      Todos los grados ({estudiantes.length} estudiantes)
                    </div>
                  </div>
                </div>
                {selectedGrade === 'Todos' && <CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0" />}
              </button>

              <div className="relative">
                <select
                  value={selectedGrade === 'Todos' ? '' : selectedGrade}
                  onChange={(e) => {
                    if (e.target.value) setSelectedGrade(e.target.value);
                  }}
                  className={`w-full h-full p-3 rounded-xl border text-xs font-black appearance-none pr-8 cursor-pointer transition-all ${
                    selectedGrade !== 'Todos'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <option value="" disabled className="text-slate-900 bg-white">
                    -- O elija un Grado Específico --
                  </option>
                  {uniqueGrades.map((g) => (
                    <option key={g} value={g} className="text-slate-900 bg-white">
                      Grado {g} ({estudiantes.filter((e) => e.grado === g).length} estudiantes)
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                    selectedGrade !== 'Todos' ? 'text-white' : 'text-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Resumen del Contenido a Exportar */}
          <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-emerald-950 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                {esGeneral ? 'Censo General (Todos los Grados)' : `Grado Seleccionado: ${selectedGrade}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                {filteredStudents.length} estudiantes
              </span>
            </div>

            {/* Mini KPIs */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Total:</span>
                <span className="font-black text-slate-900">{filteredStudents.length}</span>
              </div>
              <div className="p-2 bg-red-50 rounded-xl border border-red-200 text-red-700">
                <span className="text-[10px] font-bold block">Críticos:</span>
                <span className="font-black">{totalCriticos}</span>
              </div>
              <div className="p-2 bg-orange-50 rounded-xl border border-orange-200 text-orange-700">
                <span className="text-[10px] font-bold block">Alerta:</span>
                <span className="font-black">{totalAlerta}</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                <span className="text-[10px] font-bold block">Ayudas:</span>
                <span className="font-black">{totalAyudas} kits</span>
              </div>
            </div>
          </div>

          {/* Botones de Descarga en Formatos Oficiales */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Elija el Formato de Descarga:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Botón Excel */}
              <button
                id="btn-download-excel-action"
                type="button"
                onClick={() => handleDownloadExcel(selectedGrade)}
                disabled={isExportingExcel || filteredStudents.length === 0}
                className="p-4 rounded-2xl bg-[#107C41] hover:bg-[#0b5c30] text-white font-black text-xs flex flex-col justify-between items-start gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-white/20 text-white">
                    <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] uppercase tracking-wider font-bold">
                    .XLSX
                  </span>
                </div>

                <div className="text-left">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>{isExportingExcel ? 'Generando Excel...' : 'Descargar en Excel'}</span>
                    <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] font-medium text-emerald-100 mt-0.5">
                    Libro con Resumen Ejecutivo, Listado con Fórmulas e Historial de Entregas.
                  </p>
                </div>
              </button>

              {/* Botón PDF */}
              <button
                id="btn-download-pdf-action"
                type="button"
                onClick={() => handleDownloadPDF(selectedGrade)}
                disabled={isExportingPDF || filteredStudents.length === 0}
                className="p-4 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-xs flex flex-col justify-between items-start gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-white/20 text-white">
                    <FileText className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] uppercase tracking-wider font-bold">
                    .PDF
                  </span>
                </div>

                <div className="text-left">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>{isExportingPDF ? 'Generando PDF...' : 'Descargar en PDF'}</span>
                    <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] font-medium text-rose-100 mt-0.5">
                    Formato oficial horizontal con membrete institucional, tablas y paginación.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Descargas Rápidas de Todos los Grados (Acceso Directo por Grado) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Descargas Rápidas por Cada Grado Escolar:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {uniqueGrades.map((g) => {
                const count = estudiantes.filter((e) => e.grado === g).length;
                return (
                  <div
                    key={g}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <span>Grado {g} ({count})</span>
                    <button
                      onClick={() => handleDownloadExcel(g)}
                      title={`Descargar Excel Grado ${g}`}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(g)}
                      title={`Descargar PDF Grado ${g}`}
                      className="p-1 rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Documentos listos para auditoría y comités institucionales</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
