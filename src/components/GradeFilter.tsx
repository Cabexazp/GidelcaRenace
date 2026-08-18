import React from 'react';
import { EstudianteReporte } from '../types';
import { Users, Filter, Grid } from 'lucide-react';
import { ordenarGradosEscolares } from '../lib/supabase';

interface GradeFilterProps {
  estudiantes: EstudianteReporte[];
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  selectedUrgencia: string;
  onSelectUrgencia: (urgencia: string) => void;
}

export const GradeFilter: React.FC<GradeFilterProps> = ({
  estudiantes,
  selectedGrade,
  onSelectGrade,
  selectedUrgencia,
  onSelectUrgencia
}) => {
  // Extraer todos los grados únicos dinámicamente
  const uniqueGrades = Array.from(new Set(estudiantes.map((e) => e.grado))).filter(Boolean) as string[];
  const sortedGrades = ordenarGradosEscolares(['Todos', ...uniqueGrades]);

  const countsByGrade = sortedGrades.reduce((acc, grado) => {
    if (grado === 'Todos') {
      acc[grado] = estudiantes.length;
    } else {
      acc[grado] = estudiantes.filter((e) => e.grado === grado).length;
    }
    return acc;
  }, {} as Record<string, number>);

  const getAlertSummaryForGrade = (grado: string) => {
    const list =
      grado === 'Todos'
        ? estudiantes
        : estudiantes.filter((e) => e.grado === grado);
    const rojos = list.filter((e) => e.nivel_urgencia === 'rojo').length;
    const naranjas = list.filter((e) => e.nivel_urgencia === 'naranja').length;
    return { rojos, naranjas };
  };

  const urgencias: { id: string; label: string; bgBadge: string; count: number }[] = [
    {
      id: 'todos',
      label: 'TODOS',
      bgBadge: 'bg-slate-100 text-slate-700',
      count: estudiantes.length
    },
    {
      id: 'verde',
      label: 'ESTABLE',
      bgBadge: 'bg-emerald-100 text-emerald-800',
      count: estudiantes.filter((e) => e.nivel_urgencia === 'verde').length
    },
    {
      id: 'naranja',
      label: 'ALERTA',
      bgBadge: 'bg-orange-100 text-orange-700',
      count: estudiantes.filter((e) => e.nivel_urgencia === 'naranja').length
    },
    {
      id: 'rojo',
      label: 'CRÍTICO',
      bgBadge: 'bg-red-100 text-red-700',
      count: estudiantes.filter((e) => e.nivel_urgencia === 'rojo').length
    },
    {
      id: 'gris',
      label: 'SIN DATOS',
      bgBadge: 'bg-slate-100 text-slate-500',
      count: estudiantes.filter((e) => (e.nivel_urgencia || 'gris') === 'gris').length
    }
  ];

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Grade Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-[0.15em] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filtrar por Grado Escolar</span>
          </h2>
          <div className="flex items-center gap-2">
            {selectedGrade !== 'Todos' && (
              <button
                onClick={() => onSelectGrade('Todos')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Ver Directorio General</span>
              </button>
            )}
            <span className="text-xs font-bold text-slate-400">
              {estudiantes.length} Estudiantes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {sortedGrades.map((grado) => {
            const isSelected = selectedGrade === grado;
            const count = countsByGrade[grado] || 0;
            const { rojos, naranjas } = getAlertSummaryForGrade(grado);

            return (
              <button
                id={`filter-grado-${grado.replace(/[^a-zA-Z0-9]/g, '_')}`}
                key={grado}
                onClick={() => onSelectGrade(grado)}
                className={`group shrink-0 px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#15803D] text-white border-[#15803D] shadow-md shadow-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span>{grado === 'Todos' ? 'Todos los Grados' : `Grado ${grado}`}</span>

                {/* Badge contador */}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected
                      ? 'bg-yellow-400 text-emerald-950 shadow-2xs'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>

                {(rojos > 0 || naranjas > 0) && (
                  <span className="flex items-center gap-0.5">
                    {rojos > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 border border-white" />
                    )}
                    {naranjas > 0 && (
                      <span className="w-2 h-2 rounded-full bg-orange-400 border border-white" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter by Urgency */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Semáforo de Estado:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {urgencias.map((u) => {
            const isSel = selectedUrgencia === u.id;
            return (
              <button
                id={`filter-urgencia-${u.id}`}
                key={u.id}
                onClick={() => onSelectUrgencia(u.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider transition-all border cursor-pointer ${
                  isSel
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500'
                    : `${u.bgBadge} border-transparent hover:opacity-80`
                }`}
              >
                <span>{u.label}</span>
                <span className="ml-1 opacity-75">({u.count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
