import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  User,
  Activity,
  Save,
  GraduationCap,
  MapPin,
  Home,
  HeartPulse,
  Utensils,
  Wifi,
  CheckSquare,
  Square
} from 'lucide-react';
import { EstudianteReporte } from '../types';
import { calcularNivelUrgencia } from '../lib/supabase';
import {
  OPCIONES_AYUDA_PRIORITARIA,
  OPCIONES_CONECTIVIDAD,
  separarOpcionesMultiples
} from '../lib/surveyOptions';

interface StudentFormModalProps {
  isOpen: boolean;
  estudianteParaEditar?: EstudianteReporte | null;
  onClose: () => void;
  onSave: (estudiante: Partial<EstudianteReporte>) => void;
}

// Sugerencias rápidas de grados comunes
const GRADOS_SUGERIDOS = ['0-1', '0-2', '1-1', '2-1', '2-2', '3-1', '4-1', '5-1', '6-1', '6-2', '7-1', '8-1', '8-2', '9-1', '10-1', '11-1'];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  estudianteParaEditar,
  onClose,
  onSave
}) => {
  const isEditing = !!estudianteParaEditar;

  const [formData, setFormData] = useState<Partial<EstudianteReporte>>({
    fecha_reporte: new Date().toISOString().split('T')[0],
    nombre_estudiante: '',
    grado: '2-2',
    nombre_acudiente: '',
    telefono: '',
    direccion: '',
    ubicacion: 'Calima El Darién',
    leciones_fisicas: 'Ninguna',
    salud_emocional: 'Estable',
    condicion_vivienda: 'Habitable',
    ayuda_prioritaria: 'Alimentos no perecederos y agua potable',
    conectividad: 'Conexión a internet estable y computador/tablet propia'
  });

  // Estados locales para las opciones múltiples
  const [selectedAyudas, setSelectedAyudas] = useState<string[]>([]);
  const [otroAyuda, setOtroAyuda] = useState<string>('');
  const [selectedConectividad, setSelectedConectividad] = useState<string[]>([]);
  const [otroConectividad, setOtroConectividad] = useState<string>('');

  useEffect(() => {
    if (estudianteParaEditar) {
      setFormData({ ...estudianteParaEditar });

      // Cargar opciones seleccionadas de ayuda prioritaria
      const ayudasArray = separarOpcionesMultiples(estudianteParaEditar.ayuda_prioritaria);
      const knownAyudas = ayudasArray.filter(a => OPCIONES_AYUDA_PRIORITARIA.includes(a as any));
      const customAyudas = ayudasArray.filter(a => !OPCIONES_AYUDA_PRIORITARIA.includes(a as any));
      setSelectedAyudas(knownAyudas);
      setOtroAyuda(customAyudas.join(', '));

      // Cargar opciones seleccionadas de conectividad
      const conArray = separarOpcionesMultiples(estudianteParaEditar.conectividad);
      const knownCon = conArray.filter(c => OPCIONES_CONECTIVIDAD.includes(c as any));
      const customCon = conArray.filter(c => !OPCIONES_CONECTIVIDAD.includes(c as any));
      setSelectedConectividad(knownCon);
      setOtroConectividad(customCon.join(', '));
    } else {
      setFormData({
        fecha_reporte: new Date().toISOString().split('T')[0],
        nombre_estudiante: '',
        grado: '2-2',
        nombre_acudiente: '',
        telefono: '',
        direccion: '',
        ubicacion: 'Calima El Darién',
        leciones_fisicas: 'Ninguna',
        salud_emocional: 'Estable',
        condicion_vivienda: 'Habitable',
        ayuda_prioritaria: 'Alimentos no perecederos y agua potable',
        conectividad: 'Conexión a internet estable y computador/tablet propia'
      });
      setSelectedAyudas(['Alimentos no perecederos y agua potable']);
      setOtroAyuda('');
      setSelectedConectividad(['Conexión a internet estable y computador/tablet propia']);
      setOtroConectividad('');
    }
  }, [estudianteParaEditar, isOpen]);

  if (!isOpen) return null;

  const toggleAyuda = (opcion: string) => {
    if (opcion === 'Ninguna por el momento') {
      setSelectedAyudas(['Ninguna por el momento']);
      setOtroAyuda('');
      return;
    }

    setSelectedAyudas(prev => {
      const filtered = prev.filter(item => item !== 'Ninguna por el momento');
      if (filtered.includes(opcion)) {
        return filtered.filter(item => item !== opcion);
      } else {
        return [...filtered, opcion];
      }
    });
  };

  const toggleConectividad = (opcion: string) => {
    setSelectedConectividad(prev => {
      if (prev.includes(opcion)) {
        return prev.filter(item => item !== opcion);
      } else {
        return [...prev, opcion];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_estudiante?.trim() || !formData.grado?.trim()) {
      alert('Por favor ingrese al menos el nombre completo y el grado del estudiante (ej: 2-2)');
      return;
    }

    // Combinar opciones seleccionadas de ayuda prioritaria
    const allAyudas = [...selectedAyudas];
    if (otroAyuda.trim()) {
      allAyudas.push(otroAyuda.trim());
    }
    const finalAyudaString = allAyudas.length > 0 ? allAyudas.join(', ') : 'Ninguna por el momento';

    // Combinar opciones seleccionadas de conectividad
    const allConectividad = [...selectedConectividad];
    if (otroConectividad.trim()) {
      allConectividad.push(otroConectividad.trim());
    }
    const finalConectividadString = allConectividad.length > 0 ? allConectividad.join(', ') : 'Sin acceso a internet ni dispositivos';

    const mergedPartial: Partial<EstudianteReporte> = {
      ...formData,
      nombre_estudiante: formData.nombre_estudiante.trim(),
      grado: formData.grado.trim(),
      ayuda_prioritaria: finalAyudaString,
      conectividad: finalConectividadString
    };

    const calculatedNivel = calcularNivelUrgencia(mergedPartial);

    onSave({
      ...mergedPartial,
      nivel_urgencia: calculatedNivel,
      ayudas_entregadas: formData.ayudas_entregadas || {
        Alimento: 0,
        Medicamento: 0,
        Ropa: 0,
        Emocional: 0,
        Construccion: 0
      },
      historial_ayudas: formData.historial_ayudas || []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FDFCF0] w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Vibrant Emerald Green */}
        <div className="bg-[#15803D] text-white p-6 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-yellow-400 text-emerald-950 font-black">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em]">
                Censo GidelcaRenace
              </span>
              <h3 className="text-xl font-black text-white">
                {isEditing ? 'Editar Ficha Estudiantil' : 'Registrar Nuevo Estudiante'}
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Datos Personales y de Contacto */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Datos del Estudiante y Contacto
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo del Estudiante *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_estudiante || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_estudiante: e.target.value })
                  }
                  placeholder="Ej: Jeremy Villanueva Azcárate"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              {/* Campo libre para Grado Escolar (Ej: 2-2) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Grado Escolar *</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    (Ej: 2-2, 8-2, 11-1)
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.grado || ''}
                  onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                  placeholder="Ej: 2-2"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-emerald-950"
                />

                {/* Sugerencias rápidas clickeables */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Comunes:</span>
                  {GRADOS_SUGERIDOS.slice(0, 8).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, grado: g })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-colors cursor-pointer ${
                        formData.grado === g
                          ? 'bg-[#15803D] text-white'
                          : 'bg-slate-100 hover:bg-emerald-100 text-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Acudiente
                </label>
                <input
                  type="text"
                  value={formData.nombre_acudiente || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_acudiente: e.target.value })
                  }
                  placeholder="Ej: Marta Lucía Gómez"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: 315 789 4432"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección de Residencia
                </label>
                <input
                  type="text"
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ej: Vereda La Selva, Finca La Esperanza"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Reporte
                </label>
                <input
                  type="date"
                  value={formData.fecha_reporte || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_reporte: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* 2. Diagnóstico y Necesidades Detectadas (6 Ítems del Censo) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Diagnóstico y Necesidades Detectadas (6 Ítems de la Encuesta)
            </h4>

            {/* Ítem 1: Ubicación Actual / Sector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Ubicación Actual / Sector de Residencia *</span>
              </label>
              <input
                type="text"
                required
                value={formData.ubicacion || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Ej: Calima El Darién, Vereda El Mirador, Barrio Centro..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
              />
            </div>

            {/* Ítems 2, 3 y 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Ítem 2: Lesiones Físicas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <span>2. Lesiones Físicas</span>
                </label>
                <input
                  type="text"
                  value={formData.leciones_fisicas || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, leciones_fisicas: e.target.value })
                  }
                  placeholder="Ej: Ninguna, Fractura..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              {/* Ítem 3: Salud Emocional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                  <span>3. Salud Emocional</span>
                </label>
                <select
                  value={formData.salud_emocional || 'Estable'}
                  onChange={(e) =>
                    setFormData({ ...formData, salud_emocional: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                >
                  <option value="Estable">Estable / Tranquilo</option>
                  <option value="Ansiedad leve">Ansiedad leve / Estrés</option>
                  <option value="Afectación emocional severa">
                    Afectación severa / Crisis
                  </option>
                  <option value="En acompañamiento psicológico">
                    En acompañamiento psicológico
                  </option>
                </select>
              </div>

              {/* Ítem 4: Condición de Vivienda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. Condición de Vivienda</span>
                </label>
                <select
                  value={formData.condicion_vivienda || 'Habitable'}
                  onChange={(e) =>
                    setFormData({ ...formData, condicion_vivienda: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                >
                  <option value="Habitable">Habitable / Sin afectación</option>
                  <option value="Daño parcial en techo">Daño parcial en techo / Tejas</option>
                  <option value="Inundación leve">Inundación leve</option>
                  <option value="Daño estructural severo">
                    Daño estructural severo / Inhabitable
                  </option>
                </select>
              </div>
            </div>

            {/* Ítem 5: ¿Requieren ayuda prioritaria en este momento? (Opciones Múltiples) */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                <span>5. ¿Requieren ayuda prioritaria en este momento? (Opción múltiple) *</span>
              </label>
              <p className="text-[11px] text-emerald-800">
                Selecciona todas las necesidades reportadas por la familia:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {OPCIONES_AYUDA_PRIORITARIA.map((opcion) => {
                  const isChecked = selectedAyudas.includes(opcion);
                  return (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => toggleAyuda(opcion)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-yellow-300 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>{opcion}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo libre para "Otro:" en ayuda prioritaria */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Otro tipo de ayuda requerida (opcional):
                </label>
                <input
                  type="text"
                  value={otroAyuda}
                  onChange={(e) => setOtroAyuda(e.target.value)}
                  placeholder="Especificar otra ayuda requerida..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Ítem 6: ¿Con qué medios de conectividad y dispositivos cuentan en casa? (Opciones Múltiples) */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
              <label className="block text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-blue-700" />
                <span>6. ¿Con qué medios de conectividad y dispositivos cuentan en casa? (Opción múltiple) *</span>
              </label>
              <p className="text-[11px] text-blue-800">
                Selecciona los medios de conectividad disponibles en el hogar:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {OPCIONES_CONECTIVIDAD.map((opcion) => {
                  const isChecked = selectedConectividad.includes(opcion);
                  return (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => toggleConectividad(opcion)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-cyan-300 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>{opcion}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo libre para "Otro:" en conectividad */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Otro medio de conectividad o dispositivo (opcional):
                </label>
                <input
                  type="text"
                  value={otroConectividad}
                  onChange={(e) => setOtroConectividad(e.target.value)}
                  placeholder="Especificar otro medio de conectividad..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#15803D] hover:bg-emerald-800 text-white text-xs font-black shadow-lg shadow-emerald-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Actualizar Ficha' : 'Registrar Estudiante'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
