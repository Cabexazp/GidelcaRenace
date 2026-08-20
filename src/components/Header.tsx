import React from 'react';
import {
  Search,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  User,
  Database,
  Printer,
  Download,
  School,
  RefreshCw,
  Key,
  LogOut,
  BarChart3,
  Users
} from 'lucide-react';
import { RolUsuario } from '../types';

interface HeaderProps {
  rolUsuario: RolUsuario;
  onSelectRol: (rol: RolUsuario) => void;
  onLogout: () => void;
  onOpenAuthModal?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenNewStudentModal: () => void;
  onOpenSupabaseModal: () => void;
  onExportData: () => void;
  supabaseCount?: number | null;
  isSupabaseSyncing?: boolean;
  onRefreshLive?: () => void;
  activeView: 'directorio' | 'reportes';
  onViewChange: (view: 'directorio' | 'reportes') => void;
}

export const Header: React.FC<HeaderProps> = ({
  rolUsuario,
  onSelectRol,
  onLogout,
  onOpenAuthModal,
  searchTerm,
  onSearchChange,
  onOpenNewStudentModal,
  onOpenSupabaseModal,
  onExportData,
  supabaseCount,
  isSupabaseSyncing,
  onRefreshLive,
  activeView,
  onViewChange
}) => {
  return (
    <header className="bg-[#15803D] text-white sticky top-0 z-30 shadow-lg shadow-emerald-950/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Branding Institucional Verde y Amarillo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
                <School className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white flex items-center gap-1 leading-none">
                  <span>GIDELCA</span>
                  <span className="text-yellow-300">RENACE</span>
                </h1>
                <div className="mt-1 flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">
                    Gimnasio del Calima • Perfil {rolUsuario.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Actions: Logout & View Switcher */}
            <div className="lg:hidden flex items-center gap-1.5">
              <button
                onClick={onLogout}
                className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl bg-red-600/90 text-white flex items-center gap-1 cursor-pointer border border-red-400/40"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3 h-3" />
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* Navigation View Switcher (Directorio vs Reportes con Gráficos) */}
          <div className="flex items-center bg-emerald-950/50 p-1 rounded-2xl border border-white/15">
            <button
              onClick={() => onViewChange('directorio')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeView === 'directorio'
                  ? 'bg-yellow-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directorio del Censo</span>
            </button>

            <button
              onClick={() => onViewChange('reportes')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeView === 'reportes'
                  ? 'bg-yellow-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reportes y Gráficos</span>
            </button>
          </div>

          {/* Search bar (visible en vista directorio) */}
          {activeView === 'directorio' ? (
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-input-estudiantes"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar por apellido, nombre o sector..."
                  className="w-full pl-9 pr-4 py-1.5 bg-white text-slate-800 placeholder-slate-400 border-none rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:block text-xs font-bold text-emerald-100">
              Métricas y Estadísticas en Vivo
            </div>
          )}

          {/* Profile Controls & Actions */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
            {/* Active profile badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-emerald-900/60 border border-emerald-700 text-xs">
              {rolUsuario === 'administrador' && <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />}
              {rolUsuario === 'docente' && <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />}
              {rolUsuario === 'estudiante' && <User className="w-3.5 h-3.5 text-purple-300" />}
              <span className="font-bold text-white capitalize">{rolUsuario}</span>
            </div>

            {/* Live Sync Status & Refresh Button */}
            {onRefreshLive && (
              <button
                id="btn-live-sync-header"
                onClick={onRefreshLive}
                disabled={isSupabaseSyncing}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-900/60 hover:bg-emerald-900/90 text-white border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Sincronización en vivo automática activa. Clic para recargar datos de Supabase ahora"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                </div>
                <RefreshCw className={`w-3.5 h-3.5 text-yellow-300 ${isSupabaseSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-[11px] font-black text-emerald-100">
                  {isSupabaseSyncing ? 'Sincronizando...' : 'En Vivo'}
                </span>
              </button>
            )}

            {/* Supabase Button */}
            {rolUsuario === 'administrador' && (
              <button
                id="btn-open-supabase"
                onClick={onOpenSupabaseModal}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Sincronización con Base de Datos Supabase"
              >
                {isSupabaseSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5 text-yellow-300" />
                )}
                <span className="hidden sm:inline">
                  {supabaseCount && supabaseCount > 0 ? `${supabaseCount} BD` : 'Supabase'}
                </span>
              </button>
            )}

            {/* Export Reports Modal Trigger Button */}
            <button
              id="btn-export-data"
              onClick={onExportData}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Descargar reportes en Excel (.xlsx) y PDF (.pdf) por grado o general"
            >
              <Download className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden sm:inline">Descargar Reportes</span>
            </button>

            {/* Add Student Button */}
            {(rolUsuario === 'administrador' || rolUsuario === 'docente') && (
              <button
                id="btn-add-student-header"
                onClick={onOpenNewStudentModal}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-emerald-950 shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Agregar</span>
              </button>
            )}

            {/* Logout / Switch Profile Button */}
            <button
              id="btn-logout"
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-600/80 hover:bg-red-600 text-white border border-red-400/30 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
              title="Cerrar sesión y cambiar de perfil"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
