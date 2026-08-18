import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Users,
  Utensils,
  Pill,
  Shirt,
  HeartHandshake,
  Hammer,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  Download,
  Filter
} from 'lucide-react';
import { EstudianteReporte, TipoAyuda } from '../types';
import { ordenarGradosEscolares } from '../lib/supabase';
import {
  separarOpcionesMultiples,
  mapearOpcionATipoAyuda,
  OPCIONES_AYUDA_PRIORITARIA,
  OPCIONES_CONECTIVIDAD
} from '../lib/surveyOptions';

interface AnalyticsReportsViewProps {
  estudiantes: EstudianteReporte[];
  onSelectStudent?: (estudiante: EstudianteReporte) => void;
}

const COLORS_URGENCIA = {
  rojo: '#EF4444',
  naranja: '#F97316',
  verde: '#10B981',
  gris: '#94A3B8'
};

const COLORS_AYUDAS = {
  Alimento: '#D97706',
  Medicamento: '#E11D48',
  Ropa: '#2563EB',
  Emocional: '#9333EA',
  Construccion: '#C2410C'
};

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({
  estudiantes,
  onSelectStudent
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('Todos');

  // Filtrar estudiantes si se seleccionó un grado específico
  const filteredStudents = useMemo(() => {
    if (selectedGradeFilter === 'Todos') return estudiantes;
    return estudiantes.filter((e) => e.grado === selectedGradeFilter);
  }, [estudiantes, selectedGradeFilter]);

  // Lista de grados únicos ordenados
  const uniqueGrades = useMemo(() => {
    const grades = Array.from(new Set(estudiantes.map((e) => e.grado))).filter(Boolean) as string[];
    return ordenarGradosEscolares(grades);
  }, [estudiantes]);

  // 1. Datos para Reporte por Grados Escolares (Distribución y Urgencia)
  const dataGrados = useMemo(() => {
    return uniqueGrades.map((grado) => {
      const enGrado = estudiantes.filter((e) => e.grado === grado);
      const rojos = enGrado.filter((e) => e.nivel_urgencia === 'rojo').length;
      const naranjas = enGrado.filter((e) => e.nivel_urgencia === 'naranja').length;
      const verdes = enGrado.filter((e) => e.nivel_urgencia === 'verde').length;
      const grises = enGrado.filter((e) => !e.nivel_urgencia || e.nivel_urgencia === 'gris').length;

      const totalAyudasEntregadas = enGrado.reduce((acc, e) => {
        const a = e.ayudas_entregadas || {
          Alimento: 0,
          Medicamento: 0,
          Ropa: 0,
          Emocional: 0,
          Construccion: 0
        };
        return acc + (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0);
      }, 0);

      return {
        grado: `Grado ${grado}`,
        gradoSimple: grado,
        totalEstudiantes: enGrado.length,
        Críticos: rojos,
        Alerta: naranjas,
        Estables: verdes,
        SinDiagnostico: grises,
        totalAyudas: totalAyudasEntregadas
      };
    });
  }, [uniqueGrades, estudiantes]);

  // 2. Datos para Total de Ayudas Entregadas (Métricas acumuladas)
  const totalesAyudas = useMemo(() => {
    let alimentos = 0;
    let medicamentos = 0;
    let ropa = 0;
    let emocional = 0;
    let construccion = 0;

    filteredStudents.forEach((e) => {
      const a = e.ayudas_entregadas || {
        Alimento: 0,
        Medicamento: 0,
        Ropa: 0,
        Emocional: 0,
        Construccion: 0
      };
      alimentos += a.Alimento || 0;
      medicamentos += a.Medicamento || 0;
      ropa += a.Ropa || 0;
      emocional += a.Emocional || 0;
      construccion += a.Construccion || 0;
    });

    const granTotal = alimentos + medicamentos + ropa + emocional + construccion;

    const chartData = [
      { name: 'Alimentos', valor: alimentos, color: COLORS_AYUDAS.Alimento },
      { name: 'Medicamentos', valor: medicamentos, color: COLORS_AYUDAS.Medicamento },
      { name: 'Ropa y Calzado', valor: ropa, color: COLORS_AYUDAS.Ropa },
      { name: 'Apoyo Emocional', valor: emocional, color: COLORS_AYUDAS.Emocional },
      { name: 'Techo/Materiales', valor: construccion, color: COLORS_AYUDAS.Construccion }
    ];

    const estudiantesAtendidos = filteredStudents.filter((e) => {
      const a = e.ayudas_entregadas || {
        Alimento: 0,
        Medicamento: 0,
        Ropa: 0,
        Emocional: 0,
        Construccion: 0
      };
      return (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0) > 0;
    }).length;

    return {
      alimentos,
      medicamentos,
      ropa,
      emocional,
      construccion,
      granTotal,
      chartData,
      estudiantesAtendidos,
      estudiantesPendientes: filteredStudents.length - estudiantesAtendidos
    };
  }, [filteredStudents]);

  // 3. Datos de Ayudas Solicitadas en la Encuesta (Demanda Inicial)
  const dataDemandasEncuesta = useMemo(() => {
    const conteo = {
      Alimento: 0,
      Ropa: 0,
      Medicamento: 0,
      Emocional: 0,
      Construccion: 0,
      Ninguna: 0,
      Otro: 0
    };

    filteredStudents.forEach((e) => {
      const opciones = separarOpcionesMultiples(e.ayuda_prioritaria);
      if (opciones.length === 0) {
        conteo.Ninguna += 1;
        return;
      }

      opciones.forEach((op) => {
        const tipo = mapearOpcionATipoAyuda(op);
        if (tipo === 'Alimento') conteo.Alimento += 1;
        else if (tipo === 'Ropa') conteo.Ropa += 1;
        else if (tipo === 'Medicamento') conteo.Medicamento += 1;
        else if (tipo === 'Emocional') conteo.Emocional += 1;
        else if (tipo === 'Construccion') conteo.Construccion += 1;
        else if (op.toLowerCase().includes('ningun')) conteo.Ninguna += 1;
        else conteo.Otro += 1;
      });
    });

    return [
      { name: 'Alimentos / Agua', solicitados: conteo.Alimento, entregados: totalesAyudas.alimentos, color: COLORS_AYUDAS.Alimento },
      { name: 'Ropa / Cobijas', solicitados: conteo.Ropa, entregados: totalesAyudas.ropa, color: COLORS_AYUDAS.Ropa },
      { name: 'Medicamentos / Salud', solicitados: conteo.Medicamento, entregados: totalesAyudas.medicamentos, color: COLORS_AYUDAS.Medicamento },
      { name: 'Apoyo Psicológico', solicitados: conteo.Emocional, entregados: totalesAyudas.emocional, color: COLORS_AYUDAS.Emocional },
      { name: 'Reparación Techo', solicitados: conteo.Construccion, entregados: totalesAyudas.construccion, color: COLORS_AYUDAS.Construccion }
    ];
  }, [filteredStudents, totalesAyudas]);

  // 4. Datos de Conectividad
  const dataConectividad = useMemo(() => {
    const stats: Record<string, number> = {
      'Internet Estable + PC/Tablet': 0,
      'Solo Celular con Wi-Fi': 0,
      'Celular Datos Limitados': 0,
      'Sin Conexión ni Dispositivos': 0,
      'Otro / Intermitente': 0
    };

    filteredStudents.forEach((e) => {
      const opciones = separarOpcionesMultiples(e.conectividad);
      if (opciones.length === 0) {
        stats['Sin Conexión ni Dispositivos'] += 1;
        return;
      }

      opciones.forEach((op) => {
        const lower = op.toLowerCase();
        if (lower.includes('estable') || lower.includes('computador') || lower.includes('tablet')) {
          stats['Internet Estable + PC/Tablet'] += 1;
        } else if (lower.includes('wi-fi') || lower.includes('wifi')) {
          stats['Solo Celular con Wi-Fi'] += 1;
        } else if (lower.includes('datos') || lower.includes('limitados')) {
          stats['Celular Datos Limitados'] += 1;
        } else if (lower.includes('sin acceso') || lower.includes('nula')) {
          stats['Sin Conexión ni Dispositivos'] += 1;
        } else {
          stats['Otro / Intermitente'] += 1;
        }
      });
    });

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    return Object.entries(stats).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [filteredStudents]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner de Reportes & Filtro de Grado */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400 text-emerald-950 font-black">
              <BarChart3 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Reportes Estadísticos y Gráficos del Censo
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Visualización gráfica en tiempo real: desglose por grado escolar, total de ayudas entregadas y diagnóstico de vulnerabilidad.
          </p>
        </div>

        {/* Selector de Filtro de Grado */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <span className="font-bold text-slate-600">Filtrar Grado:</span>
          <select
            value={selectedGradeFilter}
            onChange={(e) => setSelectedGradeFilter(e.target.value)}
            className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Todos">Todos los Grados ({estudiantes.length} estudiantes)</option>
            {uniqueGrades.map((g) => (
              <option key={g} value={g}>
                Grado {g} ({estudiantes.filter((e) => e.grado === g).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards de Resumen General */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Estudiantes */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Censo Estudiantil</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {filteredStudents.length}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {selectedGradeFilter === 'Todos' ? 'Estudiantes en el censo oficial' : `Estudiantes en Grado ${selectedGradeFilter}`}
          </p>
        </div>

        {/* Total Ayudas Entregadas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Total Ayudas Entregadas</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-900">
            {totalesAyudas.granTotal}
          </p>
          <p className="text-[11px] text-amber-700 font-medium">
            Kits y entregas registradas
          </p>
        </div>

        {/* Estudiantes Atendidos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Beneficiados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900">
            {totalesAyudas.estudiantesAtendidos}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium">
            Han recibido al menos 1 ayuda ({Math.round((totalesAyudas.estudiantesAtendidos / (filteredStudents.length || 1)) * 100)}%)
          </p>
        </div>

        {/* Pendientes de Atención */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
            <span>Pendientes</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700">
            {totalesAyudas.estudiantesPendientes}
          </p>
          <p className="text-[11px] text-rose-600 font-medium">
            Sin entregas registradas aún
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: REPORTE POR GRADOS ESCOLARES (Gráfico de Barras) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
              Módulo 1
            </span>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#15803D]" />
              <span>Reporte de Estudiantes y Estado de Urgencia por Grado Escolar</span>
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Crítico
            </span>
            <span className="flex items-center gap-1 text-orange-600">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Alerta
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Estable
            </span>
          </div>
        </div>

        {/* Gráfico de Barras Recharts */}
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataGrados}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="gradoSimple"
                tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '1rem',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="Críticos" stackId="a" fill={COLORS_URGENCIA.rojo} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Alerta" stackId="a" fill={COLORS_URGENCIA.naranja} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Estables" stackId="a" fill={COLORS_URGENCIA.verde} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla Desglosada por Grado */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-black uppercase text-[10px]">
                <th className="py-2.5 px-3">Grado</th>
                <th className="py-2.5 px-3 text-center">Total Estudiantes</th>
                <th className="py-2.5 px-3 text-center text-red-600">Críticos (Rojo)</th>
                <th className="py-2.5 px-3 text-center text-orange-600">Alerta (Naranja)</th>
                <th className="py-2.5 px-3 text-center text-emerald-700">Estables (Verde)</th>
                <th className="py-2.5 px-3 text-center text-amber-800">Ayudas Entregadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataGrados.map((row) => (
                <tr key={row.gradoSimple} className="hover:bg-slate-50 font-bold">
                  <td className="py-2 px-3 text-emerald-950 font-black flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span>{row.grado}</span>
                  </td>
                  <td className="py-2 px-3 text-center text-slate-800 font-black">{row.totalEstudiantes}</td>
                  <td className="py-2 px-3 text-center text-red-700 bg-red-50/40">{row.Críticos}</td>
                  <td className="py-2 px-3 text-center text-orange-700 bg-orange-50/40">{row.Alerta}</td>
                  <td className="py-2 px-3 text-center text-emerald-800 bg-emerald-50/40">{row.Estables}</td>
                  <td className="py-2 px-3 text-center font-black text-amber-900 bg-amber-50/40">
                    {row.totalAyudas} kits
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 2: TOTAL POR AYUDAS CON GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 2.1: Total de Ayudas Entregadas por Tipo (Donut / Pie) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">
              Módulo 2
            </span>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-amber-600" />
              <span>Distribución de Ayudas Entregadas</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Desglose de los {totalesAyudas.granTotal} kits entregados a los estudiantes
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {totalesAyudas.granTotal === 0 ? (
              <div className="text-slate-400 text-xs font-bold">No se han registrado entregas todavía</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totalesAyudas.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="valor"
                  >
                    {totalesAyudas.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '1rem',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Mini cards de totales por tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-amber-800 block">Alimentos:</span>
                <span className="font-black text-amber-950 text-sm">{totalesAyudas.alimentos}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-rose-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-rose-800 block">Salud/Med:</span>
                <span className="font-black text-rose-950 text-sm">{totalesAyudas.medicamentos}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-blue-800 block">Ropa:</span>
                <span className="font-black text-blue-950 text-sm">{totalesAyudas.ropa}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-100 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-purple-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-purple-800 block">Emocional:</span>
                <span className="font-black text-purple-950 text-sm">{totalesAyudas.emocional}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-2 col-span-2 sm:col-span-1">
              <Hammer className="w-4 h-4 text-orange-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-orange-800 block">Techo/Const:</span>
                <span className="font-black text-orange-950 text-sm">{totalesAyudas.construccion}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2.2: Comparativo Solicitado vs. Entregado */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">
              Módulo 3
            </span>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Demanda Solicitada vs. Ayudas Entregadas</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Compara lo que las familias solicitaron en el formulario contra lo entregado
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataDemandasEncuesta}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '1rem',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="solicitados" name="Solicitados en Censo" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="entregados" name="Entregados Realmente" fill="#15803D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 font-semibold flex items-center justify-between">
            <span>Cobertura de Atención Nutricional:</span>
            <span className="font-black text-blue-950">
              {totalesAyudas.alimentos} entregas realizadas
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: DIAGNÓSTICO DE CONECTIVIDAD Y DISPOSITIVOS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest block">
            Módulo 4
          </span>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-purple-600" />
            <span>Diagnóstico de Conectividad y Medios Tecnológicos en el Hogar</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Respuestas de los hogares respecto a conectividad a internet y disponibilidad de dispositivos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataConectividad}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {dataConectividad.map((entry, index) => (
                    <Cell key={`cell-con-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '1rem',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {dataConectividad.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-800">{item.name}</span>
                </div>
                <span className="font-black text-slate-900 px-2 py-0.5 bg-white rounded-lg border border-slate-200">
                  {item.value} familias ({Math.round((item.value / (filteredStudents.length || 1)) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
