import React, { useState } from 'react';
import {
  School,
  ShieldCheck,
  GraduationCap,
  User,
  Key,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { RolUsuario } from '../types';

interface LoginViewProps {
  onLoginSuccess: (rol: RolUsuario) => void;
  totalEstudiantes?: number;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  totalEstudiantes = 0
}) => {
  const [selectedRole, setSelectedRole] = useState<RolUsuario | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleSelect = (rol: RolUsuario) => {
    setSelectedRole(rol);
    setPinInput('');
    setErrorMsg(null);

    // Si es estudiante, el acceso es directo y libre
    if (rol === 'estudiante') {
      onLoginSuccess('estudiante');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPin = pinInput.trim();

    if (selectedRole === 'administrador') {
      if (cleanPin === '4321' || cleanPin === 'admin') {
        onLoginSuccess('administrador');
      } else {
        setErrorMsg('PIN de Administrador incorrecto. Verifique su clave de acceso.');
      }
    } else if (selectedRole === 'docente') {
      if (cleanPin === '4320' || cleanPin === 'docente') {
        onLoginSuccess('docente');
      } else {
        setErrorMsg('PIN de Docente incorrecto. Verifique su clave de acceso.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Top Bar Institucional */}
      <header className="bg-[#15803D] text-white py-3.5 px-4 sm:px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-yellow-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <School className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white flex items-center gap-1.5 leading-none">
                <span>GIDELCA</span>
                <span className="text-yellow-300">RENACE</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-100 uppercase tracking-widest mt-0.5">
                Gimnasio del Calima • Censo Escolar y Gestión de Ayudas
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-100 bg-emerald-900/50 px-3 py-1.5 rounded-full border border-emerald-700/50 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Sistema Seguro de Autenticación</span>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col items-center justify-center w-full">
        <div className="text-center max-w-xl mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Portal de Acceso Institucional</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Selecciona tu Perfil de Usuario
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Ingresa con el perfil correspondiente a tu labor en la institución para acceder a tu sección autorizada.
          </p>
        </div>

        {/* Selector de 3 Perfiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
          {/* Card 1: Administrador */}
          <div
            onClick={() => handleRoleSelect('administrador')}
            className={`p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden bg-white ${
              selectedRole === 'administrador'
                ? 'border-yellow-400 ring-4 ring-yellow-400/20 shadow-xl scale-[1.02]'
                : 'border-slate-200 hover:border-yellow-400/70 hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-emerald-950 flex items-center justify-center font-black shadow-sm">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                  Nivel Directivo
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Administrador
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Control total: entrega y anulación de ayudas, edición de encuestas, eliminar registros y sincronización de base de datos.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Requiere PIN de seguridad</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Acceso protegido</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-yellow-400 group-hover:text-emerald-950 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Docente */}
          <div
            onClick={() => handleRoleSelect('docente')}
            className={`p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden bg-white ${
              selectedRole === 'docente'
                ? 'border-emerald-600 ring-4 ring-emerald-600/20 shadow-xl scale-[1.02]'
                : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#15803D] text-white flex items-center justify-center font-black shadow-sm">
                <GraduationCap className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                  Nivel Pedagógico
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Docente / Orientador
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Consulta del censo por grados escolares, registro de nuevos censos estudiantiles y registro de entregas.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Requiere PIN de seguridad</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Acceso docente</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 3: Estudiante (Acceso Libre) */}
          <div
            onClick={() => handleRoleSelect('estudiante')}
            className="p-5 sm:p-6 rounded-3xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden bg-white group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-sm">
                <User className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 block">
                  Comunidad Educativa
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Estudiante / Acudiente
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Consulta confidencial de su ficha censal, estado de ayudas asignadas y reportes generales del colegio.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-purple-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Acceso directo (Sin clave)</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700">Entrar libremente</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Entrada de PIN (Si seleccionó Admin o Docente) */}
        {selectedRole && selectedRole !== 'estudiante' && (
          <div className="mt-8 max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-slate-100 text-slate-800 mb-1">
                {selectedRole === 'administrador' ? (
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                ) : (
                  <GraduationCap className="w-6 h-6 text-[#15803D]" />
                )}
              </div>
              <h4 className="text-lg font-black text-slate-900">
                Ingresa tu PIN de {selectedRole === 'administrador' ? 'Administrador' : 'Docente'}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Escribe tu PIN de 4 dígitos para acceder a tu sección
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  PIN de Acceso:
                </label>
                <div className="relative">
                  <input
                    id="input-pin-auth"
                    type={showPassword ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    autoFocus
                    maxLength={10}
                    placeholder="••••"
                    className="w-full px-4 py-3 text-center text-xl font-black tracking-widest bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-emerald-600 focus:outline-none focus:bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 animate-in shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  selectedRole === 'administrador'
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-emerald-950'
                    : 'bg-[#15803D] hover:bg-emerald-800 text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Confirmar y Entrar al Sistema</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer Institucional */}
      <footer className="bg-slate-900 text-slate-400 py-4 px-6 text-center text-xs border-t border-slate-800">
        <p className="font-medium">
          Gimnasio del Calima (GIDELCA) • Calima El Darién, Valle del Cauca • Censo Comunitario y Escolar
        </p>
      </footer>
    </div>
  );
};
