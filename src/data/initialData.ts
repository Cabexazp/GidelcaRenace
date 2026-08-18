import { EstudianteReporte } from '../types';

export const ESTUDIANTES_INICIALES: EstudianteReporte[] = [
  {
    id: 'gid-001',
    fecha_reporte: '2026-08-10',
    nombre_estudiante: 'Valentina Restrepo Morales',
    grado: '6°',
    nombre_acudiente: 'Marta Morales Sánchez',
    telefono: '3128492011',
    direccion: 'Vereda La Primavera, Sector Alto',
    leciones_fisicas: 'Ninguna',
    salud_emocional: 'Estable pero con preocupación por víveres familiares',
    ubicacion: 'Zona rural Vereda La Primavera',
    condicion_vivienda: 'Afectación parcial en tejas del techo por vendaval',
    ayuda_prioritaria: 'Alimento',
    conectividad: 'Intermitente sólo datos móviles',
    nivel_urgencia: 'naranja',
    ayudas_entregadas: {
      Alimento: 2,
      Medicamento: 0,
      Ropa: 1,
      Emocional: 1,
      Construccion: 0
    },
    historial_ayudas: [
      {
        id: 'h-101',
        tipo: 'Alimento',
        fecha: '2026-08-12 09:30',
        responsable: 'Comité de Bienestar Gimnasio del Calima',
        observaciones: 'Entrega de mercado familiar de emergencia'
      },
      {
        id: 'h-102',
        tipo: 'Ropa',
        fecha: '2026-08-14 14:00',
        responsable: 'Psicorientación Gidelca',
        observaciones: 'Prendas de abrigo y calzado escolar'
      },
      {
        id: 'h-103',
        tipo: 'Emocional',
        fecha: '2026-08-16 11:15',
        responsable: 'Orientación Escolar',
        observaciones: 'Sesión de escucha y acompañamiento'
      }
    ]
  },
  {
    id: 'gid-002',
    fecha_reporte: '2026-08-11',
    nombre_estudiante: 'Santiago Gómez Carvajal',
    grado: '6°',
    nombre_acudiente: 'Carlos Gómez Toro',
    telefono: '3157891234',
    direccion: 'Barrio San Jorge, Mz C Casa 12',
    leciones_fisicas: 'Traumatismo leve en tobillo derecho',
    salud_emocional: 'Crisis de angustia y dificultades para conciliar el sueño',
    ubicacion: 'Casco Urbano Calima El Darién',
    condicion_vivienda: 'Vivienda inundada con pérdida de enseres y camas',
    ayuda_prioritaria: 'Construccion',
    conectividad: 'Buena conexión Wifi',
    nivel_urgencia: 'rojo',
    ayudas_entregadas: {
      Alimento: 3,
      Medicamento: 1,
      Ropa: 2,
      Emocional: 2,
      Construccion: 1
    },
    historial_ayudas: [
      {
        id: 'h-201',
        tipo: 'Alimento',
        fecha: '2026-08-11 16:20',
        responsable: 'Rectoría / Admón Gidelca',
        observaciones: 'Ración de víveres no perecederos'
      },
      {
        id: 'h-202',
        tipo: 'Construccion',
        fecha: '2026-08-13 10:00',
        responsable: 'Brigada Comunitaria Calima',
        observaciones: 'Láminas de zinc y cemento para reparación de muro'
      },
      {
        id: 'h-203',
        tipo: 'Medicamento',
        fecha: '2026-08-15 15:30',
        responsable: 'Cruz Roja Seccional',
        observaciones: 'Analgésicos y vendas elásticas'
      }
    ]
  },
  {
    id: 'gid-003',
    fecha_reporte: '2026-08-12',
    nombre_estudiante: 'Mariana Isabella Castro',
    grado: '7°',
    nombre_acudiente: 'Gloria Inés Patiño',
    telefono: '3186549088',
    direccion: 'Vereda El Mirador, Finca Los Pinos',
    leciones_fisicas: 'Ninguna',
    salud_emocional: 'Tranquila, actitud colaborativa con sus compañeros',
    ubicacion: 'Vereda El Mirador',
    condicion_vivienda: 'Habitable sin daños estructurales',
    ayuda_prioritaria: 'Ropa',
    conectividad: 'Buena conexión',
    nivel_urgencia: 'verde',
    ayudas_entregadas: {
      Alimento: 1,
      Medicamento: 0,
      Ropa: 1,
      Emocional: 0,
      Construccion: 0
    },
    historial_ayudas: [
      {
        id: 'h-301',
        tipo: 'Alimento',
        fecha: '2026-08-14 10:15',
        responsable: 'Docente Titular 7°',
        observaciones: 'Kit de refrigerios escolares'
      }
    ]
  },
  {
    id: 'gid-004',
    fecha_reporte: '2026-08-12',
    nombre_estudiante: 'Mateo Alejandro Benítez',
    grado: '7°',
    nombre_acudiente: 'Rodrigo Benítez Ramos',
    telefono: '3104523319',
    direccion: 'Sector Puente de Tierra',
    leciones_fisicas: 'Laceraciones leves en brazos',
    salud_emocional: 'Ansiedad moderada por situación económica',
    ubicacion: 'Sector Puente de Tierra',
    condicion_vivienda: 'Filtraciones de agua en habitaciones',
    ayuda_prioritaria: 'Medicamento',
    conectividad: 'Sin señal de internet, solo llamadas GSM',
    nivel_urgencia: 'naranja',
    ayudas_entregadas: {
      Alimento: 1,
      Medicamento: 1,
      Ropa: 0,
      Emocional: 1,
      Construccion: 0
    },
    historial_ayudas: [
      {
        id: 'h-401',
        tipo: 'Medicamento',
        fecha: '2026-08-13 11:45',
        responsable: 'Enfermería Institucional',
        observaciones: 'Antiséptico, gasas y curaciones'
      }
    ]
  },
  {
    id: 'gid-005',
    fecha_reporte: '2026-08-13',
    nombre_estudiante: 'Gabriela Sofía Ortiz',
    grado: '8°',
    nombre_acudiente: 'Esperanza Ortiz Díaz',
    telefono: '3209871122',
    direccion: 'Barrio Los Fundadores, Cra 4 # 8-19',
    leciones_fisicas: 'Herida en miembro inferior en tratamiento',
    salud_emocional: 'Afectación severa por duelo familiar reciente',
    ubicacion: 'Barrio Los Fundadores',
    condicion_vivienda: 'Pérdida total de techo por vendaval severo',
    ayuda_prioritaria: 'Emocional',
    conectividad: 'Sin señal celular actualmente',
    nivel_urgencia: 'rojo',
    ayudas_entregadas: {
      Alimento: 2,
      Medicamento: 2,
      Ropa: 3,
      Emocional: 3,
      Construccion: 2
    },
    historial_ayudas: [
      {
        id: 'h-501',
        tipo: 'Emocional',
        fecha: '2026-08-13 17:00',
        responsable: 'Psicología de Emergencia Gidelca',
        observaciones: 'Atención prioritaria y activación de red de apoyo'
      },
      {
        id: 'h-502',
        tipo: 'Construccion',
        fecha: '2026-08-15 08:30',
        responsable: 'Comité de Infraestructura',
        observaciones: 'Apoyo con materiales de cerramiento'
      }
    ]
  },
  {
    id: 'gid-006',
    fecha_reporte: '2026-08-14',
    nombre_estudiante: 'Nicolás David Salazar',
    grado: '8°',
    nombre_acudiente: 'Alfonso Salazar Méndez',
    telefono: '3137819920',
    direccion: 'Vereda San José',
    leciones_fisicas: 'Ninguna',
    salud_emocional: 'Estable',
    ubicacion: 'Vereda San José',
    condicion_vivienda: 'Vivienda sin novedades reportadas',
    ayuda_prioritaria: 'Alimento',
    conectividad: 'Buena conexión',
    nivel_urgencia: 'verde',
    ayudas_entregadas: {
      Alimento: 1,
      Medicamento: 0,
      Ropa: 0,
      Emocional: 0,
      Construccion: 0
    },
    historial_ayudas: [
      {
        id: 'h-601',
        tipo: 'Alimento',
        fecha: '2026-08-16 09:00',
        responsable: 'Docente Coordinador',
        observaciones: 'Complemento nutricional'
      }
    ]
  },
  {
    id: 'gid-007',
    fecha_reporte: '2026-08-14',
    nombre_estudiante: 'Juan Camilo Herrera Rivas',
    grado: '9°',
    nombre_acudiente: 'Nancy Rivas Cuartas',
    telefono: '3116554432',
    direccion: 'Vereda La Cristalina, KM 4',
    leciones_fisicas: 'Sin registro médico',
    salud_emocional: 'Sin evaluación reciente',
    ubicacion: 'Vereda La Cristalina',
    condicion_vivienda: 'No especificada',
    ayuda_prioritaria: 'Sin especificar',
    conectividad: 'Desconocida',
    nivel_urgencia: 'gris',
    ayudas_entregadas: {
      Alimento: 0,
      Medicamento: 0,
      Ropa: 0,
      Emocional: 0,
      Construccion: 0
    },
    historial_ayudas: []
  },
  {
    id: 'gid-008',
    fecha_reporte: '2026-08-15',
    nombre_estudiante: 'Laura Camila Osorio',
    grado: '9°',
    nombre_acudiente: 'Patricia Osorio Zuluaga',
    telefono: '3145521990',
    direccion: 'Vereda El Darién Centro',
    leciones_fisicas: 'Ninguna',
    salud_emocional: 'Motivada para continuar clases',
    ubicacion: 'Sector Central',
    condicion_vivienda: 'Habitable',
    ayuda_prioritaria: 'Ropa',
    conectividad: 'Wifi comunitario',
    nivel_urgencia: 'verde',
    ayudas_entregadas: {
      Alimento: 1,
      Medicamento: 0,
      Ropa: 1,
      Emocional: 0,
      Construccion: 0
    },
    historial_ayudas: []
  },
  {
    id: 'gid-009',
    fecha_reporte: '2026-08-15',
    nombre_estudiante: 'Daniel Felipe Marín',
    grado: '10°',
    nombre_acudiente: 'Héctor Fabio Marín',
    telefono: '3174410988',
    direccion: 'Vereda Río Bravo',
    leciones_fisicas: 'Golpe contuso en hombro derecho',
    salud_emocional: 'Estrés agudo por aislamiento vial',
    ubicacion: 'Zona rural Río Bravo',
    condicion_vivienda: 'Riesgo de deslizamiento cercano a la vivienda',
    ayuda_prioritaria: 'Construccion',
    conectividad: 'Solo mensajes de texto esporádicos',
    nivel_urgencia: 'rojo',
    ayudas_entregadas: {
      Alimento: 2,
      Medicamento: 1,
      Ropa: 1,
      Emocional: 1,
      Construccion: 1
    },
    historial_ayudas: [
      {
        id: 'h-901',
        tipo: 'Alimento',
        fecha: '2026-08-16 14:00',
        responsable: 'Comité de Ayudas Gidelca',
        observaciones: 'Paquete de alimentos de larga duración'
      }
    ]
  },
  {
    id: 'gid-010',
    fecha_reporte: '2026-08-16',
    nombre_estudiante: 'Ana María Betancourt',
    grado: '10°',
    nombre_acudiente: 'Claudia Betancourt',
    telefono: '3168892144',
    direccion: 'Calle 10 # 5-22, Calima',
    leciones_fisicas: 'Ninguna',
    salud_emocional: 'Estable con acompañamiento familiar',
    ubicacion: 'Casco Urbano',
    condicion_vivienda: 'Daño en marquesina y patio',
    ayuda_prioritaria: 'Ropa',
    conectividad: 'Buena conexión fibra óptica',
    nivel_urgencia: 'naranja',
    ayudas_entregadas: {
      Alimento: 1,
      Medicamento: 0,
      Ropa: 2,
      Emocional: 1,
      Construccion: 0
    },
    historial_ayudas: []
  },
  {
    id: 'gid-011',
    fecha_reporte: '2026-08-16',
    nombre_estudiante: 'Emmanuel López Cárdenas',
    grado: '11°',
    nombre_acudiente: 'Mauricio López',
    telefono: '3192233445',
    direccion: 'Vereda Las Brisas',
    leciones_fisicas: 'Ninguna',
    salud_emocional: 'Estable, líder juvenil en el albergue',
    ubicacion: 'Vereda Las Brisas',
    condicion_vivienda: 'Buena condición general',
    ayuda_prioritaria: 'Alimento',
    conectividad: 'Internet móvil estable',
    nivel_urgencia: 'verde',
    ayudas_entregadas: {
      Alimento: 2,
      Medicamento: 0,
      Ropa: 1,
      Emocional: 0,
      Construccion: 0
    },
    historial_ayudas: [
      {
        id: 'h-1101',
        tipo: 'Alimento',
        fecha: '2026-08-17 10:00',
        responsable: 'Coordinación 11° Gidelca',
        observaciones: 'Kits alimentarios entregados'
      }
    ]
  },
  {
    id: 'gid-012',
    fecha_reporte: '2026-08-17',
    nombre_estudiante: 'Samuel Esteban Quintana',
    grado: '11°',
    nombre_acudiente: 'Rosa Elena Quintana',
    telefono: '3123344556',
    direccion: 'Pendiente por confirmar',
    leciones_fisicas: 'Sin información',
    salud_emocional: 'Pendiente valoración',
    ubicacion: 'Sector no especificado',
    condicion_vivienda: 'Sin datos',
    ayuda_prioritaria: 'Sin registro',
    conectividad: 'Sin datos',
    nivel_urgencia: 'gris',
    ayudas_entregadas: {
      Alimento: 0,
      Medicamento: 0,
      Ropa: 0,
      Emocional: 0,
      Construccion: 0
    },
    historial_ayudas: []
  }
];

export const GRADOS_DISPONIBLES = [
  'Todos',
  'Transición',
  '1°',
  '2°',
  '3°',
  '4°',
  '5°',
  '6°',
  '7°',
  '8°',
  '9°',
  '10°',
  '11°'
];

export const TIPOS_AYUDA_INFO = [
  {
    id: 'Alimento' as const,
    label: 'Alimento',
    icon: 'Utensils',
    color: 'emerald',
    bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeBg: 'bg-emerald-600 text-white',
    description: 'Mercados, raciones de emergencia y kits nutricionales'
  },
  {
    id: 'Medicamento' as const,
    label: 'Medicamento',
    icon: 'Pill',
    color: 'blue',
    bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeBg: 'bg-blue-600 text-white',
    description: 'Botiquín, analgésicos, curaciones y prescripciones médicas'
  },
  {
    id: 'Ropa' as const,
    label: 'Ropa',
    icon: 'Shirt',
    color: 'violet',
    bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeBg: 'bg-purple-600 text-white',
    description: 'Calzado, abrigos, uniformes y ropa de diario'
  },
  {
    id: 'Emocional' as const,
    label: 'Emocional',
    icon: 'HeartHandshake',
    color: 'rose',
    bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeBg: 'bg-rose-600 text-white',
    description: 'Atención psicológica, contención emocional y escucha activa'
  },
  {
    id: 'Construccion' as const,
    label: 'Construcción',
    icon: 'Hammer',
    color: 'amber',
    bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeBg: 'bg-amber-600 text-white',
    description: 'Materiales de reparación de techos, zinc, madera y cerramiento'
  }
];
