import React from 'react';
import { EstudianteReporte } from '../types';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  School,
  HeartHandshake
} from 'lucide-react';
import { ordenarGradosEscolares } from '../lib/supabase';

interface GradeDirectoryViewProps {
  estudiantes: EstudianteReporte[];
  onSelectGrade: (grade: string) => void;
}

export const GradeDirectoryView: React.FC<GradeDirectoryViewProps> = ({
  estudiantes,
  onSelectGrade
}) => {
  // Obtener lista única de grados dinámicamente desde los estudiantes
  const uniqueGrades = Array.from(new Set(estudiantes.map((e) => e.grado))).filter(Boolean) as string[];
  const sortedGrades = ordenarGradosEscolares(uniqueGrades);

  // Estadísticas por cada grado
  const gradeStats = sortedGrades.map((grado) => {
    const list = estudiantes.filter((e) => e.grado === grado);
    const rojos = list.filter((e) => e.nivel_urgencia === 'rojo').length;
    const naranjas = list.filter((e) => e.nivel_urgencia === 'naranja').length;
    const verdes = list.filter((e) => e.nivel_urgencia === 'verde').length;
    const sinDatos = list.filter((e) => !e.nivel_urgencia || e.nivel_urgencia === 'gris').length;

    // Ayuda más demandada en el grado
    const aidCounts: Record<string, number> = {};
    list.forEach((e) => {
      const aid = e.ayuda_prioritaria || 'Alimento';
      aidCounts[aid] = (aidCounts[aid] || 0) + 1;
    });

    const topAidEntry = Object.entries(aidCounts).sort((a, b) => b[1] - a[1])[0];
    const topAid = topAidEntry ? topAidEntry[0] : 'Alimento';

    return {
      grado,
      total: list.length,
      rojos,
      naranjas,
      verdes,
      sinDatos,
      topAid
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Directory Header Banner */}
      <div className="bg-gradient-to-br from-[#15803D] via-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-yellow-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 text-xs font-black uppercase tracking-wider">
            <School className="w-3.5 h-3.5" />
            <span>Directorio de Grados y Grupos • Gimnasio del Calima</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Selecciona un Grado para consultar sus Estudiantes
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            Se encontraron <strong className="text-yellow-300 font-black">{estudiantes.length} estudiantes</strong> distribuidos en <strong className="text-yellow-300 font-black">{sortedGrades.length} grupos escolares</strong>. Haz clic en cualquiera de los grados para ver únicamente su listado detallado y gestionar sus ayudas.
          </p>
        </div>
      </div>

      {/* Grid de Grados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gradeStats.map((stat) => {
          const hasCritical = stat.rojos > 0;
          const hasAlert = stat.naranjas > 0;

          return (
            <div
              key={stat.grado}
              id={`grade-card-${stat.grado}`}
              onClick={() => onSelectGrade(stat.grado)}
              className="group bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Accent top indicator */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  hasCritical
                    ? 'bg-rose-500'
                    : hasAlert
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
              />

              <div className="space-y-3 pt-1">
                {/* Header with grade badge and total count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center font-black text-sm group-hover:bg-yellow-400 group-hover:text-emerald-950 transition-colors shrink-0">
                      <GraduationCap className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Grado {stat.grado}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400">
                        {stat.total} {stat.total === 1 ? 'Estudiante' : 'Estudiantes'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 text-xs font-black transition-colors shadow-2xs">
                    {stat.total}
                  </span>
                </div>

                {/* Urgency Status Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Semáforo de Vulnerabilidad:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stat.rojos > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        {stat.rojos} Crítico
                      </span>
                    )}

                    {stat.naranjas > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {stat.naranjas} Alerta
                      </span>
                    )}

                    {stat.verdes > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {stat.verdes} Estable
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority aid demand info */}
                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Mayor requerimiento:</span>
                  <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    {stat.topAid}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#15803D] group-hover:text-emerald-800">
                <span>Ver {stat.total} estudiantes</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
