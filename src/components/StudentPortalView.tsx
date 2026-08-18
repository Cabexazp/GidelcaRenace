import React, { useState } from 'react';
import {
  User,
  Search,
  CheckCircle2,
  Calendar,
  MapPin,
  HeartHandshake,
  Clock,
  ShieldAlert,
  Sparkles,
  School,
  Utensils,
  Pill,
  Shirt,
  Hammer
} from 'lucide-react';
import { EstudianteReporte } from '../types';
import { StudentSilhouette } from './StudentSilhouette';

interface StudentPortalViewProps {
  estudiantes: EstudianteReporte[];
  onSelectStudent: (estudiante: EstudianteReporte) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  estudiantes,
  onSelectStudent
}) => {
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    estudiantes[0]?.id || ''
  );

  const currentStudent =
    estudiantes.find((e) => e.id === selectedStudentId) || estudiantes[0];

  const filtered = estudiantes.filter(
    (e) =>
      e.nombre_estudiante.toLowerCase().includes(searchStudent.toLowerCase()) ||
      e.grado.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (e.telefono && e.telefono.includes(searchStudent))
  );

  if (!currentStudent) {
    return (
      <div className="p-8 text-center bg-white rounded-[2rem] border border-slate-200">
        <p className="text-slate-500 font-bold">No se encontraron registros de estudiantes.</p>
      </div>
    );
  }

  const nivel = currentStudent.nivel_urgencia || 'gris';
  const ayudas = currentStudent.ayudas_entregadas || {
    Alimento: 0,
    Medicamento: 0,
    Ropa: 0,
    Emocional: 0,
    Construccion: 0
  };
  const historial = currentStudent.historial_ayudas || [];

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida Estudiantil con Vibrant Green Theme */}
      <div className="bg-[#15803D] text-white rounded-[2.5rem] p-7 shadow-xl shadow-emerald-950/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-yellow-300 border border-white/15">
              <div className="h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />
              <span>Portal de Consulta Estudiantil</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              GIDELCA<span className="text-yellow-300">RENACE</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl font-medium">
              Consulta de manera segura y confidencial el estado de tu censo y las ayudas asignadas por el Gimnasio del Calima.
            </p>
          </div>

          {/* Selector de estudiante */}
          <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 max-w-xs w-full">
            <label className="block text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1.5">
              Seleccionar tu Nombre:
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-emerald-200 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Filtrar tu nombre..."
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-black/30 text-white placeholder-emerald-200/60 rounded-xl border border-white/20 focus:outline-none font-medium"
              />
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#15803D] text-white rounded-xl border border-white/30 font-bold focus:outline-none"
            >
              {filtered.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre_estudiante} (Grado {e.grado})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ficha Principal del Estudiante */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-7 shadow-sm space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <StudentSilhouette nivel={nivel} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-emerald-950 shadow-xs">
                  Grado {currentStudent.grado}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  ID: {currentStudent.id}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                {currentStudent.nombre_estudiante}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentStudent.ubicacion || 'Calima El Darién'}</span>
                <span>•</span>
                <span>Acudiente: {currentStudent.nombre_acudiente || 'No especificado'}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Solo Lectura (Estudiante)
            </span>
          </div>
        </div>

        {/* Resumen de Ayudas */}
        <div>
          <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-3">
            Tus Ayudas Entregadas
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs font-bold text-slate-700">Alimento</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {ayudas.Alimento || 0}
              </div>
              <span className="text-[10px] font-black text-yellow-600 uppercase mt-1">Paquetes</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-bold text-slate-700">Medicina</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {ayudas.Medicamento || 0}
              </div>
              <span className="text-[10px] font-black text-yellow-600 uppercase mt-1">Dosis</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs font-bold text-slate-700">Ropa</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {ayudas.Ropa || 0}
              </div>
              <span className="text-[10px] font-black text-yellow-600 uppercase mt-1">Prendas</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span className="text-xs font-bold text-slate-700">Emocional</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {ayudas.Emocional || 0}
              </div>
              <span className="text-[10px] font-black text-yellow-600 uppercase mt-1">Sesiones</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs font-bold text-slate-700">Construc.</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {ayudas.Construccion || 0}
              </div>
              <span className="text-[10px] font-black text-yellow-600 uppercase mt-1">Láminas</span>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Historial de Ayudas Recibidas
          </h4>

          {historial.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-bold">
              No registras entregas en el sistema hasta el momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {historial.map((h, i) => (
                <div
                  key={h.id || i}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                    <div>
                      <span className="font-black text-slate-800 block">
                        {h.tipo} ({h.observaciones || 'Entregado'})
                      </span>
                      <span className="text-[10px] text-slate-400">{h.responsable}</span>
                    </div>
                  </div>
                  <span className="text-slate-500 font-bold text-[11px]">{h.fecha}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
