import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  EstudianteReporte,
  RolUsuario,
  TipoAyuda
} from './types';
import { ESTUDIANTES_INICIALES } from './data/initialData';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { GradeFilter } from './components/GradeFilter';
import { GradeDirectoryView } from './components/GradeDirectoryView';
import { StudentCard } from './components/StudentCard';
import { StudentDetailModal } from './components/StudentDetailModal';
import { StudentFormModal } from './components/StudentFormModal';
import { QuickAidModal } from './components/QuickAidModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { StudentPortalView } from './components/StudentPortalView';
import { AuthRoleModal } from './components/AuthRoleModal';
import { LoginView } from './components/LoginView';
import { AnalyticsReportsView } from './components/AnalyticsReportsView';
import {
  cargarTodosLosEstudiantesSupabase,
  guardarEstudianteEnSupabase,
  eliminarEstudianteEnSupabase,
  registrarEventoAyudaEnSupabase,
  eliminarEventoAyudaEnSupabase,
  guardarEstudiantesLocalesEnCache,
  DEFAULT_TABLE_NAME
} from './lib/supabase';
import {
  ordenarEstudiantesPorPrimerApellido,
  extraerPrimerApellido
} from './lib/nameSorter';
import {
  GraduationCap,
  Users,
  Search,
  PlusCircle,
  AlertCircle,
  FileDown,
  RefreshCw,
  ShieldCheck,
  Building2,
  CheckCircle2,
  School,
  HelpCircle,
  Database,
  ArrowLeft,
  Grid,
  ArrowUpDown,
  Key,
  Trash2,
  BarChart3,
  LogOut
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'gidelca_renace_estudiantes_v1';
const TABLE_STORAGE_KEY = 'gidelca_renace_table_name';
const SESSION_ROLE_KEY = 'gidelca_active_session_role';

export default function App() {
  // Nombre de tabla configurado
  const [tableName, setTableName] = useState<string>(() => {
    return localStorage.getItem(TABLE_STORAGE_KEY) || DEFAULT_TABLE_NAME;
  });

  // Estado de estudiantes con persistencia local
  const [estudiantes, setEstudiantes] = useState<EstudianteReporte[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Usar datos iniciales si falla
    }
    return ESTUDIANTES_INICIALES;
  });

  // Rol activo (administrador | docente | estudiante | null)
  // Obliga a iniciar sesión si no hay una sesión activa guardada
  const [rolUsuario, setRolUsuario] = useState<RolUsuario | null>(() => {
    try {
      const savedRole = sessionStorage.getItem(SESSION_ROLE_KEY);
      if (savedRole === 'administrador' || savedRole === 'docente' || savedRole === 'estudiante') {
        return savedRole as RolUsuario;
      }
    } catch {}
    return null;
  });

  // Vista activa: Directorio del Censo o Reportes Estadísticos con Gráficos
  const [activeView, setActiveView] = useState<'directorio' | 'reportes'>('directorio');

  // Criterio de ordenamiento (apellido | nombre | urgencia | reciente)
  const [sortBy, setSortBy] = useState<'apellido' | 'nombre' | 'urgencia' | 'reciente'>('apellido');

  // Estado de conexión con Supabase
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [supabaseLiveCount, setSupabaseLiveCount] = useState<number | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('Todos');
  const [selectedUrgencia, setSelectedUrgencia] = useState<string>('todos');

  // Modales
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<EstudianteReporte | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [studentToEdit, setStudentToEdit] = useState<EstudianteReporte | null>(null);
  const [isQuickAidModalOpen, setIsQuickAidModalOpen] = useState<boolean>(false);
  const [studentForAid, setStudentForAid] = useState<EstudianteReporte | null>(null);
  const [initialAidType, setInitialAidType] = useState<TipoAyuda>('Alimento');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Guardar en localStorage automáticamente
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(estudiantes));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }, [estudiantes]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Inicio de sesión exitoso
  const handleLoginSuccess = (rol: RolUsuario) => {
    setRolUsuario(rol);
    try {
      sessionStorage.setItem(SESSION_ROLE_KEY, rol);
    } catch {}
    showNotification(`¡Sesión iniciada correctamente en modo ${rol.toUpperCase()}!`);
  };

  // Cierre de sesión y retorno a pantalla de inicio
  const handleLogout = () => {
    setRolUsuario(null);
    try {
      sessionStorage.removeItem(SESSION_ROLE_KEY);
    } catch {}
    showNotification('Sesión cerrada. Seleccione un perfil para ingresar.');
  };

  // Cargar automáticamente datos reales desde Supabase al iniciar
  const fetchRealDataFromSupabase = useCallback(async (targetTable = tableName) => {
    setIsSupabaseSyncing(true);
    try {
      let result = await cargarTodosLosEstudiantesSupabase(targetTable);

      // Si no devolvió nada en la tabla por defecto, probar alternativas comunes
      if ((result.error || result.data.length === 0) && targetTable === DEFAULT_TABLE_NAME) {
        const fallbackTables = ['encuesta', 'estudiantes', 'censo', 'censo_estudiantil'];
        for (const altTable of fallbackTables) {
          const altResult = await cargarTodosLosEstudiantesSupabase(altTable);
          if (!altResult.error && altResult.data.length > 0) {
            result = altResult;
            targetTable = altTable;
            setTableName(altTable);
            localStorage.setItem(TABLE_STORAGE_KEY, altTable);
            break;
          }
        }
      }

      if (result.data && result.data.length > 0) {
        setEstudiantes(result.data);
        setSupabaseConnected(true);
        setSupabaseLiveCount(result.data.length);
        showNotification(`🟢 ${result.data.length} estudiantes sincronizados desde tabla ${targetTable}`);
      } else if (result.error) {
        console.warn('Supabase fetch notice:', result.error.message || result.error);
        setSupabaseConnected(false);
      }
    } catch (err) {
      console.warn('Error conectando a Supabase:', err);
      setSupabaseConnected(false);
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, [tableName]);

  // Ejecutar carga en mount
  useEffect(() => {
    fetchRealDataFromSupabase();
  }, [fetchRealDataFromSupabase]);

  // Cambiar tabla de Supabase y recargar
  const handleTableNameChange = (newTableName: string) => {
    setTableName(newTableName);
    localStorage.setItem(TABLE_STORAGE_KEY, newTableName);
    fetchRealDataFromSupabase(newTableName);
  };

  // Filtrado y Ordenamiento de estudiantes
  const filteredEstudiantes = useMemo(() => {
    let result = [...estudiantes];

    // Filtro por grado
    if (selectedGrade !== 'Todos') {
      result = result.filter((e) => e.grado === selectedGrade);
    }

    // Filtro por nivel de urgencia
    if (selectedUrgencia !== 'todos') {
      result = result.filter((e) => e.nivel_urgencia === selectedUrgencia);
    }

    // Filtro por término de búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.nombre_estudiante.toLowerCase().includes(term) ||
          (e.nombre_acudiente && e.nombre_acudiente.toLowerCase().includes(term)) ||
          (e.ubicacion && e.ubicacion.toLowerCase().includes(term)) ||
          (e.grado && e.grado.toLowerCase().includes(term)) ||
          (e.telefono && e.telefono.includes(term))
      );
    }

    // Ordenamiento
    if (sortBy === 'apellido') {
      result = ordenarEstudiantesPorPrimerApellido(result);
    } else if (sortBy === 'nombre') {
      result.sort((a, b) => a.nombre_estudiante.localeCompare(b.nombre_estudiante, 'es'));
    } else if (sortBy === 'urgencia') {
      const prioridad: Record<string, number> = { rojo: 1, naranja: 2, verde: 3, gris: 4 };
      result.sort((a, b) => {
        const pA = prioridad[a.nivel_urgencia || 'gris'] || 4;
        const pB = prioridad[b.nivel_urgencia || 'gris'] || 4;
        return pA - pB;
      });
    } else if (sortBy === 'reciente') {
      result.sort((a, b) => {
        const fA = a.fecha_reporte || '';
        const fB = b.fecha_reporte || '';
        return fB.localeCompare(fA);
      });
    }

    return result;
  }, [estudiantes, selectedGrade, selectedUrgencia, searchTerm, sortBy]);

  // Guardar o Crear Estudiante (con sincronización en Supabase)
  const handleSaveStudent = async (data: Partial<EstudianteReporte>) => {
    let updatedStudent: EstudianteReporte;

    if (studentToEdit) {
      // Edición
      updatedStudent = {
        ...studentToEdit,
        ...data,
        nombre_estudiante: data.nombre_estudiante || studentToEdit.nombre_estudiante,
        grado: data.grado || studentToEdit.grado
      } as EstudianteReporte;

      setEstudiantes((prev) => {
        const next = prev.map((e) => (e.id === updatedStudent.id ? updatedStudent : e));
        guardarEstudiantesLocalesEnCache(next);
        return next;
      });
      showNotification(`Estudiante "${updatedStudent.nombre_estudiante}" actualizado.`);
    } else {
      // Creación
      const newId = `gid_${Date.now()}`;
      updatedStudent = {
        id: newId,
        fecha_reporte: data.fecha_reporte || new Date().toISOString().split('T')[0],
        nombre_estudiante: data.nombre_estudiante || '',
        grado: data.grado || '2-2',
        nombre_acudiente: data.nombre_acudiente || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        ubicacion: data.ubicacion || 'Calima El Darién',
        leciones_fisicas: data.leciones_fisicas || 'Ninguna',
        salud_emocional: data.salud_emocional || 'Estable',
        condicion_vivienda: data.condicion_vivienda || 'Habitable',
        ayuda_prioritaria: data.ayuda_prioritaria || 'Alimentos no perecederos y agua potable',
        conectividad: data.conectividad || 'Conexión a internet estable y computador/tablet propia',
        nivel_urgencia: data.nivel_urgencia || 'gris',
        ayudas_entregadas: {
          Alimento: 0,
          Medicamento: 0,
          Ropa: 0,
          Emocional: 0,
          Construccion: 0
        },
        historial_ayudas: []
      };

      setEstudiantes((prev) => {
        const next = [updatedStudent, ...prev];
        guardarEstudiantesLocalesEnCache(next);
        return next;
      });
      showNotification(`Estudiante "${updatedStudent.nombre_estudiante}" agregado al censo.`);
    }

    // Sincronizar en Supabase
    try {
      const syncRes = await guardarEstudianteEnSupabase(updatedStudent, tableName);
      if (syncRes.success) {
        setSupabaseConnected(true);
        showNotification(`✅ Sincronizado en Supabase: ${updatedStudent.nombre_estudiante}`);
      } else if (syncRes.message) {
        showNotification(`⚠️ Guardado localmente. Supabase: ${syncRes.message}`);
      }
    } catch (e: any) {
      console.warn('No se pudo sincronizar en Supabase:', e);
      showNotification(`⚠️ Guardado localmente (Error Supabase: ${e?.message || e})`);
    }
  };

  // Eliminar Estudiante definitivamente (con persistencia contra recarga)
  const handleDeleteStudent = async (estudiante: EstudianteReporte) => {
    if (rolUsuario !== 'administrador') {
      showNotification('Solo el Administrador puede eliminar estudiantes del censo.');
      return;
    }

    // 1. Quitar del estado local inmediatamente y guardar en caché
    setEstudiantes((prev) => {
      const next = prev.filter((e) => e.id !== estudiante.id);
      guardarEstudiantesLocalesEnCache(next);
      return next;
    });

    // 2. Si estaba abierto en el modal de detalle, cerrarlo
    if (selectedStudentForDetail && selectedStudentForDetail.id === estudiante.id) {
      setSelectedStudentForDetail(null);
    }

    showNotification(`🗑️ Estudiante "${estudiante.nombre_estudiante}" eliminado del censo.`);

    // 3. Ejecutar eliminación en Supabase y lista negra
    try {
      const delRes = await eliminarEstudianteEnSupabase(estudiante, tableName);
      if (!delRes.success && delRes.message) {
        showNotification(delRes.message);
      }
    } catch (e: any) {
      console.warn('Error eliminando en Supabase:', e);
    }
  };

  // Abrir modal de entrega de ayuda
  const handleOpenQuickAid = (estudiante: EstudianteReporte, tipo?: TipoAyuda) => {
    setStudentForAid(estudiante);
    setInitialAidType(tipo || 'Alimento');
    setIsQuickAidModalOpen(true);
  };

  // Confirmar entrega de ayuda
  const handleConfirmAidDelivery = (
    estudianteId: string,
    tipo: TipoAyuda,
    cantidad: number,
    fecha: string,
    responsable: string,
    observaciones: string
  ) => {
    let studentToSync: EstudianteReporte | null = null;

    setEstudiantes((prev) => {
      return prev.map((est) => {
        if (est.id !== estudianteId) return est;

        const currentCounts = est.ayudas_entregadas || {
          Alimento: 0,
          Medicamento: 0,
          Ropa: 0,
          Emocional: 0,
          Construccion: 0
        };

        const updatedCounts = {
          ...currentCounts,
          [tipo]: (currentCounts[tipo] || 0) + cantidad
        };

        const nuevoHistorialItem = {
          id: `ayuda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tipo,
          fecha,
          responsable,
          observaciones,
          cantidad
        };

        const updatedStudent: EstudianteReporte = {
          ...est,
          ayudas_entregadas: updatedCounts,
          historial_ayudas: [nuevoHistorialItem, ...(est.historial_ayudas || [])]
        };

        studentToSync = updatedStudent;

        if (selectedStudentForDetail && selectedStudentForDetail.id === estudianteId) {
          setSelectedStudentForDetail(updatedStudent);
        }

        return updatedStudent;
      });
    });

    if (studentToSync) {
      registrarEventoAyudaEnSupabase(
        studentToSync,
        tipo,
        cantidad,
        fecha,
        responsable,
        observaciones
      );
    }

    showNotification(`¡Ayuda de ${tipo} (+${cantidad}) registrada y sincronizada!`);
  };

  // Anular o quitar una ayuda si hubo equivocación
  const handleRemoveAidDelivery = async (
    estudianteId: string,
    itemHistorialId: string,
    tipo: TipoAyuda,
    cantidad: number
  ) => {
    if (rolUsuario !== 'administrador') {
      showNotification('Solo el Administrador puede anular entregas de ayudas.');
      return;
    }

    setEstudiantes((prev) => {
      return prev.map((est) => {
        if (est.id !== estudianteId) return est;

        const currentCounts = est.ayudas_entregadas || {
          Alimento: 0,
          Medicamento: 0,
          Ropa: 0,
          Emocional: 0,
          Construccion: 0
        };

        const updatedCounts = {
          ...currentCounts,
          [tipo]: Math.max(0, (currentCounts[tipo] || 0) - cantidad)
        };

        const nuevoHistorial = (est.historial_ayudas || []).filter(
          (h) => h.id !== itemHistorialId
        );

        const updatedStudent: EstudianteReporte = {
          ...est,
          ayudas_entregadas: updatedCounts,
          historial_ayudas: nuevoHistorial
        };

        if (selectedStudentForDetail && selectedStudentForDetail.id === estudianteId) {
          setSelectedStudentForDetail(updatedStudent);
        }

        return updatedStudent;
      });
    });

    try {
      await eliminarEventoAyudaEnSupabase(itemHistorialId);
    } catch (e) {
      console.warn('Error eliminando evento en Supabase:', e);
    }

    showNotification(`Se anuló la entrega de ${tipo} (-${cantidad}) correctamente.`);
  };

  // Exportar reporte completo a CSV
  const handleExportCSV = () => {
    const headers = [
      'Primer Apellido',
      'Nombre Completo',
      'Grado',
      'Acudiente',
      'Teléfono',
      'Ubicación / Sector',
      'Dirección',
      'Lesiones Físicas',
      'Salud Emocional',
      'Condición Vivienda',
      'Ayuda Prioritaria Requerida',
      'Conectividad',
      'Nivel Urgencia',
      'Alimentos Entregados',
      'Medicamentos Entregados',
      'Ropa Entregada',
      'Apoyo Emocional Entregado',
      'Construcción Entregada'
    ];

    const listaOrdenada = ordenarEstudiantesPorPrimerApellido(estudiantes);

    const rows = listaOrdenada.map((e) => [
      `"${extraerPrimerApellido(e.nombre_estudiante)}"`,
      `"${e.nombre_estudiante}"`,
      `"${e.grado}"`,
      `"${e.nombre_acudiente || ''}"`,
      `"${e.telefono || ''}"`,
      `"${e.ubicacion || ''}"`,
      `"${e.direccion || ''}"`,
      `"${e.leciones_fisicas || 'Ninguna'}"`,
      `"${e.salud_emocional || 'Estable'}"`,
      `"${e.condicion_vivienda || 'Habitable'}"`,
      `"${e.ayuda_prioritaria || ''}"`,
      `"${e.conectividad || ''}"`,
      `"${e.nivel_urgencia || 'gris'}"`,
      e.ayudas_entregadas?.Alimento || 0,
      e.ayudas_entregadas?.Medicamento || 0,
      e.ayudas_entregadas?.Ropa || 0,
      e.ayudas_entregadas?.Emocional || 0,
      e.ayudas_entregadas?.Construccion || 0
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `censo_gidelca_ordenado_apellidos_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Reporte del censo ordenado por apellido descargado en CSV.');
  };

  // SI NO HAY SESIÓN ACTIVA: Renderizar la pantalla obligatoria de Selección de Perfil / Login
  if (!rolUsuario) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        totalEstudiantes={estudiantes.length}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Notificación Flotante */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Institucional con Selección de Vista y Logout */}
      <Header
        rolUsuario={rolUsuario}
        onSelectRol={(rol) => {
          setRolUsuario(rol);
          try {
            sessionStorage.setItem(SESSION_ROLE_KEY, rol);
          } catch {}
          showNotification(`Cambiaste al perfil: ${rol.toUpperCase()}`);
        }}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenNewStudentModal={() => {
          setStudentToEdit(null);
          setIsFormModalOpen(true);
        }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onExportData={handleExportCSV}
        supabaseCount={supabaseLiveCount || estudiantes.length}
        isSupabaseSyncing={isSupabaseSyncing}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Banner de Estado de Base de Datos */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                supabaseConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              <Database className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900">
                  Base de Datos Supabase (Tabla: {tableName}):
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    supabaseConnected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {supabaseConnected ? 'Conectado en Vivo' : 'Censo Cargado'}
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">
                Censo institucional: <strong>{estudiantes.length} estudiantes registrados</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => fetchRealDataFromSupabase(tableName)}
              disabled={isSupabaseSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Volver a sincronizar desde Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSupabaseSyncing ? 'animate-spin' : ''}`} />
              <span>{isSupabaseSyncing ? 'Sincronizando...' : 'Recargar'}</span>
            </button>

            {rolUsuario === 'administrador' && (
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black transition-colors cursor-pointer"
              >
                Configurar BD ⚙️
              </button>
            )}
          </div>
        </div>

        {/* Banner de Rol e Información de Sesión */}
        <div className="p-4 rounded-[2rem] bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl font-black flex items-center justify-center shrink-0 shadow-xs ${
                rolUsuario === 'administrador'
                  ? 'bg-yellow-400 text-emerald-950'
                  : rolUsuario === 'docente'
                  ? 'bg-[#15803D] text-white'
                  : 'bg-purple-600 text-white'
              }`}
            >
              {rolUsuario === 'administrador' ? (
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              ) : rolUsuario === 'docente' ? (
                <GraduationCap className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Users className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Perfil en Sesión:
                </span>
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {rolUsuario}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-red-600 hover:text-red-800 font-bold underline flex items-center gap-1 cursor-pointer ml-2"
                  title="Cerrar sesión actual"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Cerrar Sesión / Cambiar</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {rolUsuario === 'administrador'
                  ? 'Control total: Entrega de ayudas, anulación de entregas por error, edición de encuestas y directorio ordenado.'
                  : rolUsuario === 'docente'
                  ? 'Acceso pedagógico: Consulta de estudiantes por grado escolar y registro de nuevos censos.'
                  : 'Portal de estudiante: Consulta confidencial de su ficha censal y registro de ayudas (sin permisos de edición).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(rolUsuario === 'administrador' || rolUsuario === 'docente') && (
              <button
                id="btn-add-student-banner"
                onClick={() => {
                  setStudentToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#15803D] hover:bg-emerald-800 text-white shadow-lg shadow-emerald-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Nuevo Registro</span>
              </button>
            )}
          </div>
        </div>

        {/* VISTA 1: REPORTES ESTADÍSTICOS Y GRÁFICOS */}
        {activeView === 'reportes' ? (
          <AnalyticsReportsView
            estudiantes={estudiantes}
            onSelectStudent={(est) => setSelectedStudentForDetail(est)}
          />
        ) : (
          /* VISTA 2: DIRECTORIO DEL CENSO ESTUDIANTIL */
          <div>
            {rolUsuario === 'estudiante' ? (
              /* Portal Estudiantil (Solo lectura) */
              <StudentPortalView
                estudiantes={estudiantes}
                onSelectStudent={(est) => setSelectedStudentForDetail(est)}
              />
            ) : (
              /* Directorio y Filtros para Administradores y Docentes */
              <div className="space-y-6">
                {/* Banner de Métricas Generales */}
                <StatsBanner
                  estudiantes={estudiantes}
                  onFilterByUrgencia={(urg) => setSelectedUrgencia(urg)}
                />

                {/* Barra de Filtros y Navegación de Grados */}
                <GradeFilter
                  estudiantes={estudiantes}
                  selectedGrade={selectedGrade}
                  onSelectGrade={setSelectedGrade}
                  selectedUrgencia={selectedUrgencia}
                  onSelectUrgencia={setSelectedUrgencia}
                />

                {/* Navegación Principal: Directorio de Grados vs Listado de Grado Específico */}
                {selectedGrade === 'Todos' && searchTerm.trim() === '' ? (
                  /* Vista Inicial de Grados */
                  <GradeDirectoryView
                    estudiantes={estudiantes}
                    onSelectGrade={(grado) => setSelectedGrade(grado)}
                  />
                ) : (
                  /* Listado de Estudiantes del Grado Seleccionado o Búsqueda Activa */
                  <div className="space-y-4">
                    {/* Header del Grado con botón de retorno y Selector de Ordenamiento */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedGrade('Todos');
                            setSearchTerm('');
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-black cursor-pointer"
                          title="Volver a todos los grados"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Volver a Grados</span>
                        </button>

                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {searchTerm.trim() !== ''
                              ? `Búsqueda: "${searchTerm}"`
                              : `Estudiantes del Grado ${selectedGrade}`}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-emerald-950 text-xs font-black shadow-2xs">
                            {filteredEstudiantes.length} estudiantes
                          </span>
                        </div>
                      </div>

                      {/* Selector de Orden Alfabético por Primer Apellido */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0">
                          <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ordenar:</span>
                        </span>
                        <select
                          value={sortBy}
                          onChange={(e: any) => setSortBy(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                        >
                          <option value="apellido">Primer Apellido (A - Z)</option>
                          <option value="nombre">Nombre Completo (A - Z)</option>
                          <option value="urgencia">Urgencia Crítica (Rojo primero)</option>
                          <option value="reciente">Fecha de Reporte (Recientes)</option>
                        </select>
                      </div>
                    </div>

                    {/* Listado de Tarjetas de Estudiantes */}
                    {filteredEstudiantes.length === 0 ? (
                      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center shadow-sm">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-black text-slate-800">
                          No se encontraron estudiantes en este grado o filtro
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                          No hay registros que coincidan con los criterios activos.
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedGrade('Todos');
                            setSelectedUrgencia('todos');
                          }}
                          className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 transition-colors cursor-pointer"
                        >
                          Volver a Directorio
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredEstudiantes.map((estudiante) => (
                          <StudentCard
                            key={estudiante.id}
                            estudiante={estudiante}
                            rolUsuario={rolUsuario}
                            onSelect={(est) => setSelectedStudentForDetail(est)}
                            onQuickAddAid={(est, tipo) => handleOpenQuickAid(est, tipo)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-yellow-400 text-emerald-950 flex items-center justify-center font-black text-xs">
              G
            </div>
            <p className="text-xs font-black text-slate-800 tracking-wide">
              GIDELCA<span className="text-emerald-700">RENACE</span> • Gimnasio del Calima
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Calima El Darién, Valle del Cauca • Sistema de Censo y Gestión de Ayudas Humanitarias
          </p>
        </div>
      </footer>

      {/* Modales */}
      <StudentDetailModal
        estudiante={selectedStudentForDetail}
        rolUsuario={rolUsuario}
        onClose={() => setSelectedStudentForDetail(null)}
        onEdit={(est) => {
          setSelectedStudentForDetail(null);
          setStudentToEdit(est);
          setIsFormModalOpen(true);
        }}
        onDelete={rolUsuario === 'administrador' ? handleDeleteStudent : undefined}
        onOpenAddAid={(est, tipo) => handleOpenQuickAid(est, tipo)}
        onDeleteAid={handleRemoveAidDelivery}
      />

      <StudentFormModal
        isOpen={isFormModalOpen}
        estudianteParaEditar={studentToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setStudentToEdit(null);
        }}
        onSave={handleSaveStudent}
      />

      <QuickAidModal
        isOpen={isQuickAidModalOpen}
        estudiante={studentForAid}
        tipoInicial={initialAidType}
        onClose={() => {
          setIsQuickAidModalOpen(false);
          setStudentForAid(null);
        }}
        onSubmitAid={handleConfirmAidDelivery}
      />

      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        estudiantes={estudiantes}
        tableName={tableName}
        onTableNameChange={handleTableNameChange}
        onClose={() => setIsSupabaseModalOpen(false)}
        onUpdateEstudiantesFromSupabase={(remoteList) => {
          setEstudiantes(remoteList);
          setSupabaseConnected(true);
          setSupabaseLiveCount(remoteList.length);
          showNotification(`¡Censo cargado con éxito! ${remoteList.length} estudiantes.`);
        }}
      />

      <AuthRoleModal
        isOpen={isAuthModalOpen}
        currentRole={rolUsuario}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectRole={(newRole) => {
          setRolUsuario(newRole);
          try {
            sessionStorage.setItem(SESSION_ROLE_KEY, newRole);
          } catch {}
          showNotification(`Sesión iniciada como: ${newRole.toUpperCase()}`);
        }}
      />
    </div>
  );
}
