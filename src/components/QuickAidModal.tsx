import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Utensils,
  Pill,
  Shirt,
  HeartHandshake,
  Hammer,
  Calendar,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { EstudianteReporte, TipoAyuda } from '../types';
import confetti from 'canvas-confetti';

interface QuickAidModalProps {
  isOpen: boolean;
  estudiante: EstudianteReporte | null;
  tipoInicial?: TipoAyuda;
  onClose: () => void;
  onSubmitAid: (
    estudianteId: string,
    tipo: TipoAyuda,
    cantidad: number,
    fecha: string,
    responsable: string,
    observaciones: string
  ) => void;
}

export const QuickAidModal: React.FC<QuickAidModalProps> = ({
  isOpen,
  estudiante,
  tipoInicial = 'Alimento',
  onClose,
  onSubmitAid
}) => {
  const [tipo, setTipo] = useState<TipoAyuda>(tipoInicial);
  const [cantidad, setCantidad] = useState<number>(1);
  const [fecha, setFecha] = useState<string>(
    () => new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  );
  const [responsable, setResponsable] = useState<string>(
    'Comité de Bienestar Gidelca'
  );
  const [observaciones, setObservaciones] = useState<string>('');

  React.useEffect(() => {
    if (tipoInicial) {
      setTipo(tipoInicial);
    }
  }, [tipoInicial]);

  if (!isOpen || !estudiante) return null;

  const tipos: { id: TipoAyuda; label: string; icon: React.ReactNode; dotColor: string }[] = [
    {
      id: 'Alimento',
      label: 'Alimento',
      icon: <Utensils className="w-4 h-4" />,
      dotColor: 'bg-red-400'
    },
    {
      id: 'Medicamento',
      label: 'Medicamento',
      icon: <Pill className="w-4 h-4" />,
      dotColor: 'bg-blue-400'
    },
    {
      id: 'Ropa',
      label: 'Ropa',
      icon: <Shirt className="w-4 h-4" />,
      dotColor: 'bg-purple-400'
    },
    {
      id: 'Emocional',
      label: 'Emocional',
      icon: <HeartHandshake className="w-4 h-4" />,
      dotColor: 'bg-pink-400'
    },
    {
      id: 'Construccion',
      label: 'Construcción',
      icon: <Hammer className="w-4 h-4" />,
      dotColor: 'bg-orange-400'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAid(
      estudiante.id,
      tipo,
      cantidad,
      fecha || new Date().toLocaleString(),
      responsable || 'Administración Gidelca',
      observaciones || `Entrega de ayuda: ${tipo}`
    );

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch {
      // Ignorar si falla
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FDFCF0] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Vibrant Emerald Green */}
        <div className="bg-[#15803D] text-white p-6 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-yellow-400 text-emerald-950 font-black">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em]">
                Registro de Entrega de Ayuda
              </span>
              <h3 className="text-lg font-black text-white truncate max-w-xs">
                {estudiante.nombre_estudiante}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between shadow-2xs">
            <span>Grado: <strong className="text-emerald-700">{estudiante.grado}</strong></span>
            <span>Sector: <strong className="text-slate-900">{estudiante.ubicacion || 'Calima'}</strong></span>
          </div>

          {/* Selector de Tipo */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Categoría de Ayuda *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tipos.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    tipo === t.id
                      ? 'bg-[#15803D] text-white border-[#15803D] shadow-md shadow-emerald-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 ${t.dotColor} rounded-full`} />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cantidad a Entregar *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha / Hora *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Responsable / Funcionario *
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones / Detalle
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Mercado de víveres completo entregado a acudiente..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-emerald-800 text-white text-xs font-black shadow-lg shadow-emerald-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar e Incrementar Ayuda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
