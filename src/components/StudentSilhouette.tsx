import React from 'react';
import { NivelUrgencia } from '../types';

interface StudentSilhouetteProps {
  nivel: NivelUrgencia;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const StudentSilhouette: React.FC<StudentSilhouetteProps> = ({
  nivel,
  size = 'md',
  className = ''
}) => {
  const getColors = () => {
    switch (nivel) {
      case 'rojo':
        return {
          bg: 'bg-red-50 border-red-500 text-red-500',
          fill: 'fill-red-400 text-red-400',
          dot: 'bg-red-500 shadow-red-200',
          label: 'Crítico / Alerta Roja'
        };
      case 'naranja':
        return {
          bg: 'bg-orange-50 border-orange-500 text-orange-500',
          fill: 'fill-orange-400 text-orange-400',
          dot: 'bg-orange-500 shadow-orange-200',
          label: 'Alerta / Alerta Naranja'
        };
      case 'verde':
        return {
          bg: 'bg-green-50 border-green-500 text-green-500',
          fill: 'fill-green-400 text-green-400',
          dot: 'bg-green-500 shadow-green-200',
          label: 'Estable / Atendido'
        };
      case 'gris':
      default:
        return {
          bg: 'bg-slate-50 border-slate-300 text-slate-400',
          fill: 'fill-slate-300 text-slate-300',
          dot: 'bg-slate-300 shadow-slate-200',
          label: 'Sin Datos'
        };
    }
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full border-2 transition-all duration-300 ${colors.bg} ${sizeClasses[size]} ${className}`}
      title={`Estado de necesidad: ${colors.label}`}
    >
      <svg
        className="w-3/5 h-3/5 transition-transform duration-300 group-hover:scale-105"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>

      {/* Traffic light indicator dot */}
      <span
        className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${colors.dot}`}
      />
    </div>
  );
};
