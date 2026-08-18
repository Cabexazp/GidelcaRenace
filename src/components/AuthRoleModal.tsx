import React, { useState } from 'react';
import { RolUsuario } from '../types';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuthRoleModalProps {
  isOpen: boolean;
  currentRole: RolUsuario;
  onClose: () => void;
  onSelectRole: (role: RolUsuario) => void;
}

export const AuthRoleModal: React.FC<AuthRoleModalProps> = ({
  isOpen,
  currentRole,
  onClose,
  onSelectRole
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<RolUsuario>(currentRole);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSwitchWithPin = (role: RolUsuario) => {
    setErrorMessage(null);

    // Para estudiante no se requiere clave (acceso de consulta libre)
    if (role === 'estudiante') {
      onSelectRole('estudiante');
      onClose();
      return;
    }

    const cleanPin = pinInput.trim();

    if (role === 'administrador') {
      if (cleanPin === '4321' || cleanPin === 'admin') {
        onSelectRole('administrador');
        onClose();
      } else {
        setErrorMessage('PIN de Administrador incorrecto. Verifique su clave de acceso.');
      }
      return;
    }

    if (role === 'docente') {
      if (cleanPin === '4320' || cleanPin === 'docente') {
        onSelectRole('docente');
        onClose();
      } else {
        setErrorMessage('PIN de Docente incorrecto. Verifique su clave de acceso.');
      }
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#15803D] to-emerald-900 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-yellow-400 text-emerald-950">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">
                Cambio de Perfil de Usuario
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Gimnasio del Calima • GidelcaRenace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Selector de Tabs de Rol */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              onClick={() => {
                setSelectedRoleTab('administrador');
                setErrorMessage(null);
                setPinInput('');
              }}
              className={`py-2.5 px-2 rounded-xl font-black text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedRoleTab === 'administrador'
                  ? 'bg-yellow-400 text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px]">Administrador</span>
            </button>

            <button
              onClick={() => {
                setSelectedRoleTab('docente');
                setErrorMessage(null);
                setPinInput('');
              }}
              className={`py-2.5 px-2 rounded-xl font-black text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedRoleTab === 'docente'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="text-[11px]">Docente</span>
            </button>

            <button
              onClick={() => {
                setSelectedRoleTab('estudiante');
                setErrorMessage(null);
                setPinInput('');
              }}
              className={`py-2.5 px-2 rounded-xl font-black text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                selectedRoleTab === 'estudiante'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[11px]">Estudiante</span>
            </button>
          </div>

          {/* Formulario de Entrada de PIN */}
          {selectedRoleTab === 'estudiante' ? (
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-purple-950 text-sm">
                  Acceso Libre y Seguro
                </h4>
                <p className="text-xs text-purple-800 mt-1 font-medium">
                  El perfil de estudiante y acudiente no requiere clave para consultar su información.
                </p>
              </div>
              <button
                onClick={() => handleSwitchWithPin('estudiante')}
                className="w-full py-3 rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-md"
              >
                Cambiar a Perfil Estudiante
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Ingrese el PIN de {selectedRoleTab === 'administrador' ? 'Administrador' : 'Docente'}:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    maxLength={10}
                    autoFocus
                    className="w-full px-4 py-3 text-center text-lg font-black tracking-widest bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-emerald-600 focus:outline-none focus:bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={() => handleSwitchWithPin(selectedRoleTab)}
                className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRoleTab === 'administrador'
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-emerald-950'
                    : 'bg-[#15803D] hover:bg-emerald-800 text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Confirmar y Cambiar de Perfil</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
