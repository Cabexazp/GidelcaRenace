import React from 'react';
import {
  Utensils,
  Pill,
  Shirt,
  HeartHandshake,
  Hammer
} from 'lucide-react';
import { EstudianteReporte } from '../types';

interface StatsBannerProps {
  estudiantes: EstudianteReporte[];
  onFilterByAid?: (tipo: string) => void;
  onFilterByUrgencia?: (urgencia: string) => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  estudiantes,
  onFilterByAid,
  onFilterByUrgencia
}) => {
  const rojos = estudiantes.filter((e) => e.nivel_urgencia === 'rojo').length;
  const naranjas = estudiantes.filter((e) => e.nivel_urgencia === 'naranja').length;
  const verdes = estudiantes.filter((e) => e.nivel_urgencia === 'verde').length;
  const grises = estudiantes.filter((e) => (e.nivel_urgencia || 'gris') === 'gris').length;

  const totalAlimentos = estudiantes.reduce(
    (acc, e) => acc + (e.ayudas_entregadas?.Alimento || 0),
    0
  );
  const totalMedicamentos = estudiantes.reduce(
    (acc, e) => acc + (e.ayudas_entregadas?.Medicamento || 0),
    0
  );
  const totalRopa = estudiantes.reduce(
    (acc, e) => acc + (e.ayudas_entregadas?.Ropa || 0),
    0
  );
  const totalEmocional = estudiantes.reduce(
    (acc, e) => acc + (e.ayudas_entregadas?.Emocional || 0),
    0
  );
  const totalConstruccion = estudiantes.reduce(
    (acc, e) => acc + (e.ayudas_entregadas?.Construccion || 0),
    0
  );

  const totalAyudasEntregadas =
    totalAlimentos +
    totalMedicamentos +
    totalRopa +
    totalEmocional +
    totalConstruccion;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Box 1: Institutional Green Summary Card */}
      <div className="lg:col-span-5 bg-[#15803D] text-white rounded-[2rem] p-6 shadow-lg shadow-emerald-950/15 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                  Censo Gimnasio del Calima
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white mt-1">
                Estado de Necesidades
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-yellow-400 text-emerald-950 shadow-xs">
              {estudiantes.length} Alumnos
            </span>
          </div>

          {/* Semáforo de prioridades interactivo */}
          <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-4 gap-2.5">
            <button
              onClick={() => onFilterByUrgencia && onFilterByUrgencia('rojo')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-center group cursor-pointer border border-white/10"
              title="Filtrar por nivel Crítico"
            >
              <div className="flex items-center justify-center gap-1 text-red-300 text-[10px] font-black tracking-wider uppercase mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>Crítico</span>
              </div>
              <div className="text-xl font-black text-white">{rojos}</div>
            </button>

            <button
              onClick={() => onFilterByUrgencia && onFilterByUrgencia('naranja')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-center group cursor-pointer border border-white/10"
              title="Filtrar por nivel Alerta"
            >
              <div className="flex items-center justify-center gap-1 text-orange-300 text-[10px] font-black tracking-wider uppercase mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span>Alerta</span>
              </div>
              <div className="text-xl font-black text-white">{naranjas}</div>
            </button>

            <button
              onClick={() => onFilterByUrgencia && onFilterByUrgencia('verde')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-center group cursor-pointer border border-white/10"
              title="Filtrar por nivel Estable"
            >
              <div className="flex items-center justify-center gap-1 text-emerald-200 text-[10px] font-black tracking-wider uppercase mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Estable</span>
              </div>
              <div className="text-xl font-black text-white">{verdes}</div>
            </button>

            <button
              onClick={() => onFilterByUrgencia && onFilterByUrgencia('gris')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-center group cursor-pointer border border-white/10"
              title="Filtrar por nivel Sin Datos"
            >
              <div className="flex items-center justify-center gap-1 text-slate-300 text-[10px] font-black tracking-wider uppercase mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>Sin datos</span>
              </div>
              <div className="text-xl font-black text-white">{grises}</div>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-medium text-emerald-200 flex items-center justify-between">
          <span>* Semáforo de riesgo por condición de vulnerabilidad</span>
          <span className="font-bold text-yellow-300">GIDELCA RENACE</span>
        </div>
      </div>

      {/* Box 2: Panel de Ayudas Entregadas */}
      <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                Panel de Ayudas Entregadas
              </h2>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                Consolidado Comunitario
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Total Despachos:</span>
              <span className="px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 font-black text-sm shadow-xs">
                {totalAyudasEntregadas}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Alimento */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-xs font-bold text-slate-700">Alimento</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{totalAlimentos}</span>
                <span className="text-[10px] font-black text-yellow-600 uppercase">Kits</span>
              </div>
            </div>

            {/* Medicamento */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-xs font-bold text-slate-700">Medicina</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{totalMedicamentos}</span>
                <span className="text-[10px] font-black text-yellow-600 uppercase">Dosis</span>
              </div>
            </div>

            {/* Ropa */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span className="text-xs font-bold text-slate-700">Ropa</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{totalRopa}</span>
                <span className="text-[10px] font-black text-yellow-600 uppercase">Prendas</span>
              </div>
            </div>

            {/* Emocional */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full" />
                <span className="text-xs font-bold text-slate-700">Emocional</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{totalEmocional}</span>
                <span className="text-[10px] font-black text-yellow-600 uppercase">Sesiones</span>
              </div>
            </div>

            {/* Construcción */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between col-span-2 sm:col-span-1 hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-xs font-bold text-slate-700">Construc.</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{totalConstruccion}</span>
                <span className="text-[10px] font-black text-yellow-600 uppercase">Láminas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span>Actualización en tiempo real</span>
          <span className="text-emerald-700 font-black">Historial con trazabilidad</span>
        </div>
      </div>
    </div>
  );
};
