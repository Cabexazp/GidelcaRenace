import React from 'react';
import {
  Utensils,
  Pill,
  Shirt,
  HeartHandshake,
  Hammer,
  Plus,
  MapPin,
  Clock
} from 'lucide-react';
import { EstudianteReporte, RolUsuario, TipoAyuda } from '../types';
import { StudentSilhouette } from './StudentSilhouette';
import { separarOpcionesMultiples } from '../lib/surveyOptions';

interface StudentCardProps {
  estudiante: EstudianteReporte;
  rolUsuario: RolUsuario;
  onSelect: (estudiante: EstudianteReporte) => void;
  onQuickAddAid?: (estudiante: EstudianteReporte, tipo: TipoAyuda) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  estudiante,
  rolUsuario,
  onSelect,
  onQuickAddAid
}) => {
  const nivel = estudiante.nivel_urgencia || 'gris';
  const ayudas = estudiante.ayudas_entregadas || {
    Alimento: 0,
    Medicamento: 0,
    Ropa: 0,
    Emocional: 0,
    Construccion: 0
  };

  const totalEntregas =
    (ayudas.Alimento || 0) +
    (ayudas.Medicamento || 0) +
    (ayudas.Ropa || 0) +
    (ayudas.Emocional || 0) +
    (ayudas.Construccion || 0);

  const getBorderColor = () => {
    switch (nivel) {
      case 'rojo':
        return 'border-red-500 ring-1 ring-red-500/20';
      case 'naranja':
        return 'border-orange-500 ring-1 ring-orange-500/20';
      case 'verde':
        return 'border-emerald-500 ring-1 ring-emerald-500/20';
      case 'gris':
      default:
        return 'border-slate-300 ring-1 ring-slate-200';
    }
  };

  const getDotColor = () => {
    switch (nivel) {
      case 'rojo':
        return 'bg-red-500';
      case 'naranja':
        return 'bg-orange-500';
      case 'verde':
        return 'bg-emerald-500';
      case 'gris':
      default:
        return 'bg-slate-300';
    }
  };

  const getNivelBadge = () => {
    switch (nivel) {
      case 'rojo':
        return {
          text: 'CRÍTICO',
          bg: 'bg-red-100 text-red-700'
        };
      case 'naranja':
        return {
          text: 'ALERTA',
          bg: 'bg-orange-100 text-orange-700'
        };
      case 'verde':
        return {
          text: 'ESTABLE',
          bg: 'bg-emerald-100 text-emerald-800'
        };
      case 'gris':
      default:
        return {
          text: 'SIN DATOS',
          bg: 'bg-slate-100 text-slate-600'
        };
    }
  };

  const lateralItems: {
    tipo: TipoAyuda;
    label: string;
    icon: React.ReactNode;
    count: number;
    dotColor: string;
  }[] = [
    {
      tipo: 'Alimento',
      label: 'Alimento',
      icon: <Utensils className="w-3 h-3" />,
      count: ayudas.Alimento || 0,
      dotColor: 'bg-red-400'
    },
    {
      tipo: 'Medicamento',
      label: 'Medicamento',
      icon: <Pill className="w-3 h-3" />,
      count: ayudas.Medicamento || 0,
      dotColor: 'bg-blue-400'
    },
    {
      tipo: 'Ropa',
      label: 'Ropa',
      icon: <Shirt className="w-3 h-3" />,
      count: ayudas.Ropa || 0,
      dotColor: 'bg-purple-400'
    },
    {
      tipo: 'Emocional',
      label: 'Emocional',
      icon: <HeartHandshake className="w-3 h-3" />,
      count: ayudas.Emocional || 0,
      dotColor: 'bg-pink-400'
    },
    {
      tipo: 'Construccion',
      label: 'Construcción',
      icon: <Hammer className="w-3 h-3" />,
      count: ayudas.Construccion || 0,
      dotColor: 'bg-orange-400'
    }
  ];

  const badgeInfo = getNivelBadge();

  return (
    <div
      id={`estudiante-card-${estudiante.id}`}
      className={`bg-white rounded-[2rem] border-2 ${getBorderColor()} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row overflow-hidden relative group`}
    >
      {/* Top right status indicator dot */}
      <div className={`absolute top-4 right-4 h-3 w-3 ${getDotColor()} rounded-full shadow-xs z-10`} />

      {/* Main Student Info Column (Clickable) */}
      <div
        onClick={() => onSelect(estudiante)}
        className="flex-1 p-5 cursor-pointer hover:bg-slate-50/60 transition-colors flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <StudentSilhouette nivel={nivel} size="md" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Grado {estudiante.grado}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${badgeInfo.bg}`}
                >
                  {badgeInfo.text}
                </span>
              </div>

              <h3 className="font-black text-base text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors truncate">
                {estudiante.nombre_estudiante}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1 font-semibold flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{estudiante.ubicacion || 'Calima El Darién'}</span>
              </p>

              {estudiante.nombre_acudiente && (
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                  Acudiente: {estudiante.nombre_acudiente}
                </p>
              )}
            </div>
          </div>

          {/* Ayuda prioritaria banner */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-0.5">
              Ayuda Prioritaria:
            </span>
            {separarOpcionesMultiples(estudiante.ayuda_prioritaria).slice(0, 3).map((op, i) => (
              <span
                key={i}
                className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 truncate max-w-[200px]"
                title={op}
              >
                {op}
              </span>
            ))}
            {separarOpcionesMultiples(estudiante.ayuda_prioritaria).length > 3 && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                +{separarOpcionesMultiples(estudiante.ayuda_prioritaria).length - 3} más
              </span>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-300" />
            {estudiante.fecha_reporte || 'Reciente'}
          </span>
          <span className="text-xs font-black text-emerald-700 group-hover:underline">
            Ver ficha completa →
          </span>
        </div>
      </div>

      {/* Lateral Aid Items Column */}
      <div className="w-full md:w-56 bg-slate-50/90 p-4 border-t md:border-t-0 md:border-l border-slate-200/80 flex flex-col justify-center gap-2">
        <div className="flex items-center justify-between text-[10px] font-black text-emerald-950 uppercase tracking-widest mb-0.5">
          <span>Panel de Ayudas</span>
          <span className="text-slate-400 font-bold">Tot: {totalEntregas}</span>
        </div>

        <div className="space-y-1.5">
          {lateralItems.map((item) => {
            const hasDelivery = item.count > 0;
            return (
              <div
                key={item.tipo}
                className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className={`w-2 h-2 ${item.dotColor} rounded-full shrink-0`} />
                  <span className="text-[11px] font-bold text-slate-700 truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Badge contador en amarillo vibrante acorde al tema */}
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                      hasDelivery
                        ? 'bg-yellow-400 text-emerald-950 ring-1 ring-yellow-500/30'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>

                  {/* Botón rápido + para Administradores */}
                  {rolUsuario === 'administrador' && onQuickAddAid && (
                    <button
                      id={`btn-add-aid-${estudiante.id}-${item.tipo}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAddAid(estudiante, item.tipo);
                      }}
                      className="w-5 h-5 rounded-lg bg-[#15803D] text-white hover:bg-emerald-700 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                      title={`Registrar entrega rápida de ${item.label}`}
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
