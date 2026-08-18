import React, { useState } from 'react';
import {
  X,
  MapPin,
  User,
  Activity,
  Home,
  AlertOctagon,
  Utensils,
  PlusCircle,
  Clock,
  Edit,
  Trash2,
  FileSpreadsheet,
  MinusCircle,
  Undo2,
  ShieldAlert,
  Wifi,
  Smartphone,
  Monitor,
  WifiOff,
  HeartHandshake,
  Shirt,
  Pill,
  Hammer,
  HelpCircle,
  Layers,
  HeartPulse
} from 'lucide-react';
import { EstudianteReporte, RolUsuario, TipoAyuda } from '../types';
import { StudentSilhouette } from './StudentSilhouette';
import {
  separarOpcionesMultiples,
  mapearOpcionATipoAyuda
} from '../lib/surveyOptions';

interface StudentDetailModalProps {
  estudiante: EstudianteReporte | null;
  rolUsuario: RolUsuario;
  onClose: () => void;
  onEdit: (estudiante: EstudianteReporte) => void;
  onDelete?: (estudiante: EstudianteReporte) => void;
  onOpenAddAid: (estudiante: EstudianteReporte, tipo?: TipoAyuda) => void;
  onDeleteAid?: (estudianteId: string, itemHistorialId: string, tipo: TipoAyuda, cantidad: number) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  estudiante,
  rolUsuario,
  onClose,
  onEdit,
  onDelete,
  onOpenAddAid,
  onDeleteAid
}) => {
  const [activeTab, setActiveTab] = useState<'encuesta' | 'historial'>('encuesta');

  if (!estudiante) return null;

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

  const historial = estudiante.historial_ayudas || [];

  const getBadgeColor = () => {
    switch (nivel) {
      case 'rojo':
        return 'bg-red-500 text-white';
      case 'naranja':
        return 'bg-orange-500 text-white';
      case 'verde':
        return 'bg-emerald-600 text-white';
      case 'gris':
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getNivelTexto = () => {
    switch (nivel) {
      case 'rojo':
        return 'Prioridad Alta / Crítica';
      case 'naranja':
        return 'Prioridad Media / Vulnerable';
      case 'verde':
        return 'Sin Riesgo Inmediato / Estable';
      case 'gris':
      default:
        return 'Sin Diagnóstico';
    }
  };

  // Helper para obtener el icono según la opción de ayuda
  const renderAidOptionIcon = (opcion: string) => {
    const tipo = mapearOpcionATipoAyuda(opcion);
    switch (tipo) {
      case 'Alimento':
        return <Utensils className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'Ropa':
        return <Shirt className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'Medicamento':
        return <Pill className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'Emocional':
        return <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'Construccion':
        return <Hammer className="w-4 h-4 text-amber-700 shrink-0" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
  };

  // Helper para obtener el icono según la opción de conectividad
  const renderConnectivityIcon = (opcion: string) => {
    const lower = opcion.toLowerCase();
    if (lower.includes('estable') || lower.includes('computador') || lower.includes('tablet')) {
      return <Monitor className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (lower.includes('wi-fi') || lower.includes('wifi')) {
      return <Wifi className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (lower.includes('datos') || lower.includes('limitados') || lower.includes('celular')) {
      return <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (lower.includes('sin acceso') || lower.includes('nula') || lower.includes('ningun')) {
      return <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />;
    }
    return <Wifi className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  // Desglosar opciones múltiples de la encuesta
  const ayudasPrioritariasList = separarOpcionesMultiples(estudiante.ayuda_prioritaria);
  const conectividadList = separarOpcionesMultiples(estudiante.conectividad);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FDFCF0] w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Vibrant Emerald Green */}
        <div className="bg-[#15803D] text-white p-6 relative shrink-0 shadow-md">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <StudentSilhouette
              grado={estudiante.grado}
              nombre={estudiante.nombre_estudiante}
              className="w-16 h-16 rounded-2xl ring-4 ring-white/20 shadow-lg text-emerald-950 font-black text-xl"
            />
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-yellow-400 text-emerald-950 font-black text-xs tracking-wider">
                  GRADO {estudiante.grado}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full font-black text-[11px] shadow-xs flex items-center gap-1.5 ${getBadgeColor()}`}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>{getNivelTexto()}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {estudiante.nombre_estudiante}
              </h2>
              <div className="flex items-center gap-3 text-xs text-emerald-100 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-yellow-300" />
                  {estudiante.ubicacion || 'Calima El Darién'}
                </span>
                <span>•</span>
                <span>Reporte: {estudiante.fecha_reporte || 'Reciente'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-6 shrink-0 shadow-2xs">
          <button
            onClick={() => setActiveTab('encuesta')}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'encuesta'
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ficha de la Encuesta</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'historial'
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Ayudas y Entregas ({historial.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'encuesta' ? (
            <div className="space-y-6">
              {/* Información Personal y Acudiente */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Datos del Estudiante y Contacto</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Nombre Completo:</span>
                    <p className="font-bold text-slate-800 text-sm">{estudiante.nombre_estudiante}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Grado Escolar:</span>
                    <p className="font-bold text-slate-800 text-sm">Grado {estudiante.grado}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Nombre del Acudiente:</span>
                    <p className="font-bold text-slate-800">
                      {estudiante.nombre_acudiente || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Teléfono de Contacto:</span>
                    <p className="font-bold text-slate-800">
                      {estudiante.telefono || 'Sin teléfono'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Dirección de Residencia:</span>
                    <p className="font-bold text-slate-800">
                      {estudiante.direccion || 'Sin dirección registrada'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Ubicación / Sector:</span>
                    <p className="font-bold text-slate-800">
                      {estudiante.ubicacion || 'Calima El Darién'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnóstico de Emergencia y Necesidades Detectadas (6 Items de la Encuesta) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Diagnóstico y Necesidades Detectadas (6 Ítems del Censo)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    6 Ítems Oficiales
                  </span>
                </div>

                {/* Grid con los primeros 4 ítems */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* 1. Ubicación Actual */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. Ubicación Actual / Sector:</span>
                    </div>
                    <p className="font-black text-slate-900 text-sm">
                      {estudiante.ubicacion || 'Calima El Darién'}
                    </p>
                  </div>

                  {/* 2. Lesiones Físicas */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      <span>2. Lesiones Físicas:</span>
                    </div>
                    <p className="font-bold text-slate-800">
                      {estudiante.leciones_fisicas || 'Ninguna'}
                    </p>
                  </div>

                  {/* 3. Salud Emocional / Apoyo Psicológico */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                      <span>3. Salud Emocional y Psicológica:</span>
                    </div>
                    <p className="font-bold text-slate-800">
                      {estudiante.salud_emocional || 'Estable'}
                    </p>
                  </div>

                  {/* 4. Condición de Vivienda */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <Home className="w-3.5 h-3.5 text-amber-600" />
                      <span>4. Condición de la Vivienda:</span>
                    </div>
                    <p className="font-bold text-slate-800">
                      {estudiante.condicion_vivienda || 'Habitable'}
                    </p>
                  </div>
                </div>

                {/* 5. ¿Requieren ayuda prioritaria en este momento? (Opción múltiple) */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#15803D] text-white">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">
                          5. ¿Requieren ayuda prioritaria en este momento?
                        </span>
                        <span className="text-xs text-emerald-950 font-bold">
                          Necesidades declaradas por la familia (Opciones múltiples)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de opciones múltiples seleccionadas en ayuda prioritaria */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ayudasPrioritariasList.length > 0 ? (
                      ayudasPrioritariasList.map((op, idx) => {
                        const tipoMapeado = mapearOpcionATipoAyuda(op);
                        return (
                          <div
                            key={idx}
                            className="bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 font-black text-slate-800">
                              {renderAidOptionIcon(op)}
                              <span>{op}</span>
                            </div>

                            {/* Botón rápido de entrega de esta ayuda específica si es admin o docente */}
                            {(rolUsuario === 'administrador' || rolUsuario === 'docente') && tipoMapeado && (
                              <button
                                onClick={() => onOpenAddAid(estudiante, tipoMapeado)}
                                className="px-2.5 py-1 rounded-lg bg-[#15803D] hover:bg-emerald-800 text-white font-black text-[10px] transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                title={`Registrar entrega de ${tipoMapeado}`}
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>Entregar {tipoMapeado}</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-500 italic">Ninguna por el momento</span>
                    )}
                  </div>
                </div>

                {/* 6. ¿Con qué medios de conectividad y dispositivos cuentan en casa? (Opción múltiple) */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-600 text-white">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-blue-800 block">
                        6. ¿Con qué medios de conectividad y dispositivos cuentan en casa?
                      </span>
                      <span className="text-xs text-blue-950 font-bold">
                        Acceso a internet y dispositivos (Opciones múltiples)
                      </span>
                    </div>
                  </div>

                  {/* Lista de opciones múltiples seleccionadas en conectividad */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {conectividadList.length > 0 ? (
                      conectividadList.map((op, idx) => (
                        <div
                          key={idx}
                          className="bg-white px-3 py-2 rounded-xl border border-blue-200 shadow-2xs flex items-center gap-2 text-xs font-bold text-slate-800"
                        >
                          {renderConnectivityIcon(op)}
                          <span>{op}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">Sin datos de conectividad</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB DE HISTORIAL DE AYUDAS */
            <div className="space-y-5">
              {/* Resumen Contador de Ayudas Entregadas */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Total Ayudas Entregadas a este Estudiante
                  </h3>
                  {rolUsuario === 'administrador' && (
                    <span className="text-[11px] font-bold text-slate-400">
                      (Puedes anular entregas erróneas abajo)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                    <Utensils className="w-4 h-4 mx-auto text-amber-700 mb-1" />
                    <span className="text-[10px] font-black uppercase text-amber-800 block">Alimentos</span>
                    <span className="text-base font-black text-amber-950">{ayudas.Alimento || 0}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
                    <Pill className="w-4 h-4 mx-auto text-rose-700 mb-1" />
                    <span className="text-[10px] font-black uppercase text-rose-800 block">Salud</span>
                    <span className="text-base font-black text-rose-950">{ayudas.Medicamento || 0}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                    <Shirt className="w-4 h-4 mx-auto text-blue-700 mb-1" />
                    <span className="text-[10px] font-black uppercase text-blue-800 block">Ropa</span>
                    <span className="text-base font-black text-blue-950">{ayudas.Ropa || 0}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
                    <HeartHandshake className="w-4 h-4 mx-auto text-purple-700 mb-1" />
                    <span className="text-[10px] font-black uppercase text-purple-800 block">Emocional</span>
                    <span className="text-base font-black text-purple-950">{ayudas.Emocional || 0}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100 col-span-2 sm:col-span-1">
                    <Hammer className="w-4 h-4 mx-auto text-orange-700 mb-1" />
                    <span className="text-[10px] font-black uppercase text-orange-800 block">Techo</span>
                    <span className="text-base font-black text-orange-950">{ayudas.Construccion || 0}</span>
                  </div>
                </div>

                {rolUsuario !== 'estudiante' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onOpenAddAid(estudiante)}
                      className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-emerald-800 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Registrar Nueva Entrega</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Lista Detallada de Entregas con opción de quitar si hubo error */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Registro de Eventos y Entregas
                </h3>

                {historial.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-100">
                    No se han registrado entregas todavía para este estudiante.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historial.map((item, idx) => {
                      return (
                        <div
                          key={item.id || idx}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs gap-3 hover:bg-slate-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-black">
                              {item.tipo === 'Alimento' && <Utensils className="w-4 h-4 text-amber-700" />}
                              {item.tipo === 'Medicamento' && <Pill className="w-4 h-4 text-rose-700" />}
                              {item.tipo === 'Ropa' && <Shirt className="w-4 h-4 text-blue-700" />}
                              {item.tipo === 'Emocional' && <HeartHandshake className="w-4 h-4 text-purple-700" />}
                              {item.tipo === 'Construccion' && <Hammer className="w-4 h-4 text-orange-700" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-sm">
                                  {item.tipo} ({item.cantidad || 1} kit/unidad)
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {item.fecha}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Entregado por: <strong>{item.responsable}</strong>
                                {item.observaciones && ` • "${item.observaciones}"`}
                              </p>
                            </div>
                          </div>

                          {/* Botón para anular / quitar entrega si hubo equivocación */}
                          {rolUsuario === 'administrador' && onDeleteAid && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `¿Desea anular o quitar la entrega de ${item.tipo} realizada el ${item.fecha}?`
                                  )
                                ) {
                                  onDeleteAid(estudiante.id, item.id, item.tipo, item.cantidad || 1);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                              title="Anular o quitar esta entrega si hubo error"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Quitar</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-bold text-slate-400">
            Rol actual: <strong className="text-slate-800 uppercase">{rolUsuario}</strong>
          </div>

          <div className="flex items-center gap-2">
            {(rolUsuario === 'administrador' || rolUsuario === 'docente') && (
              <button
                onClick={() => onEdit(estudiante)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar Encuesta</span>
              </button>
            )}

            {rolUsuario === 'administrador' && onDelete && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `¿Está seguro de eliminar definitivamente a "${estudiante.nombre_estudiante}" (Grado ${estudiante.grado}) del censo escolar y de la base de datos?`
                    )
                  ) {
                    onDelete(estudiante);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-red-200"
                title="Eliminar estudiante definitivamente del censo"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Eliminar Estudiante</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
