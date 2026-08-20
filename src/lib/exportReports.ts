import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EstudianteReporte, TipoAyuda } from '../types';
import { ordenarGradosEscolares } from './supabase';
import { ordenarEstudiantesPorPrimerApellido } from './nameSorter';
import {
  separarOpcionesMultiples,
  mapearOpcionATipoAyuda
} from './surveyOptions';

// Helper para descargar un Blob en el navegador
function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Obtener fecha formateada para el nombre de archivo
function getFileTimestamp(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFormattedDate(): string {
  const d = new Date();
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * EXPORTAR REPORTE A EXCEL (.XLSX)
 * Soporta reporte General (todos los grados) o por un Grado escolar específico
 */
export async function exportarReporteExcel(
  todosLosEstudiantes: EstudianteReporte[],
  opciones: {
    grado?: string; // Si se omite o es 'Todos', se exporta el general
    tituloInstitucion?: string;
  } = {}
) {
  const { grado = 'Todos', tituloInstitucion = 'Gimnasio del Calima' } = opciones;
  const esGeneral = grado === 'Todos' || !grado;

  // Filtrar estudiantes según el grado seleccionado
  const estudiantesFiltrados = esGeneral
    ? todosLosEstudiantes
    : todosLosEstudiantes.filter((e) => e.grado === grado);

  const listaOrdenada = ordenarEstudiantesPorPrimerApellido(estudiantesFiltrados);
  const gradosUnicos = ordenarGradosEscolares(
    Array.from(new Set(todosLosEstudiantes.map((e) => e.grado))).filter(Boolean) as string[]
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = `${tituloInstitucion} - Sistema de Censo`;
  workbook.lastModifiedBy = 'Comité Gidelca';
  workbook.created = new Date();

  // ----------------------------------------------------
  // HOJA 1: RESUMEN ESTADÍSTICO Y EJECUTIVO
  // ----------------------------------------------------
  const wsResumen = workbook.addWorksheet(esGeneral ? 'Resumen General' : `Resumen Grado ${grado}`);

  // Estilo de colores institucionales
  const COLOR_VERDE_HEADER = '15803D';
  const COLOR_AMARILLO_HEADER = 'FACC15';

  // Título Institucional
  wsResumen.mergeCells('A1:G1');
  const titleCell = wsResumen.getCell('A1');
  titleCell.value = `${tituloInstitucion.toUpperCase()} - REPORTE OFICIAL DE CENSO Y AYUDAS`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_VERDE_HEADER } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsResumen.getRow(1).height = 30;

  // Subtítulo
  wsResumen.mergeCells('A2:G2');
  const subCell = wsResumen.getCell('A2');
  subCell.value = esGeneral
    ? 'REPORTE CONSOLIDADO INSTITUCIONAL - TODOS LOS GRADOS'
    : `REPORTE DETALLADO - GRADO ${grado.toUpperCase()}`;
  subCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsResumen.getRow(2).height = 22;

  // Metadatos
  wsResumen.getCell('A4').value = 'Fecha de Emisión:';
  wsResumen.getCell('A4').font = { bold: true };
  wsResumen.getCell('B4').value = getFormattedDate();

  wsResumen.getCell('A5').value = 'Alcance del Reporte:';
  wsResumen.getCell('A5').font = { bold: true };
  wsResumen.getCell('B5').value = esGeneral ? 'General (Censo Completo)' : `Específico: Grado ${grado}`;

  wsResumen.getCell('A6').value = 'Total Estudiantes Evaluados:';
  wsResumen.getCell('A6').font = { bold: true };
  wsResumen.getCell('B6').value = estudiantesFiltrados.length;
  wsResumen.getCell('B6').font = { bold: true, color: { argb: 'FF15803D' } };

  // Cálculo de totales y métricas
  const totalRojos = estudiantesFiltrados.filter((e) => e.nivel_urgencia === 'rojo').length;
  const totalNaranjas = estudiantesFiltrados.filter((e) => e.nivel_urgencia === 'naranja').length;
  const totalVerdes = estudiantesFiltrados.filter((e) => e.nivel_urgencia === 'verde').length;
  const totalSinDatos = estudiantesFiltrados.filter((e) => !e.nivel_urgencia || e.nivel_urgencia === 'gris').length;

  let totAlimentos = 0;
  let totMedicamentos = 0;
  let totRopa = 0;
  let totEmocional = 0;
  let totConstruccion = 0;

  estudiantesFiltrados.forEach((e) => {
    const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
    totAlimentos += a.Alimento || 0;
    totMedicamentos += a.Medicamento || 0;
    totRopa += a.Ropa || 0;
    totEmocional += a.Emocional || 0;
    totConstruccion += a.Construccion || 0;
  });
  const granTotalAyudas = totAlimentos + totMedicamentos + totRopa + totEmocional + totConstruccion;

  const estudiantesAtendidos = estudiantesFiltrados.filter((e) => {
    const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
    return (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0) > 0;
  }).length;

  // TABLA DE DIAGNÓSTICO DE VULNERABILIDAD
  wsResumen.getCell('A8').value = '1. DIAGNÓSTICO DE VULNERABILIDAD Y URGENCIA';
  wsResumen.getCell('A8').font = { bold: true, size: 11, color: { argb: 'FF15803D' } };

  wsResumen.getRow(9).values = ['Nivel de Urgencia', 'Cantidad Estudiantes', '% del Total', 'Prioridad de Atención'];
  wsResumen.getRow(9).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsResumen.getRow(9).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: 'center' };
  });

  const rowRojo = wsResumen.addRow(['Crítico (Rojo - Emergencia Inmediata)', totalRojos, `${Math.round((totalRojos / (estudiantesFiltrados.length || 1)) * 100)}%`, 'ALTA']);
  rowRojo.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
  rowRojo.getCell(1).font = { color: { argb: 'FF991B1B' }, bold: true };

  const rowNaranja = wsResumen.addRow(['Alerta (Naranja - Vulnerabilidad Media)', totalNaranjas, `${Math.round((totalNaranjas / (estudiantesFiltrados.length || 1)) * 100)}%`, 'MEDIA']);
  rowNaranja.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
  rowNaranja.getCell(1).font = { color: { argb: 'FF9A3412' }, bold: true };

  const rowVerde = wsResumen.addRow(['Estable (Verde - En Condiciones Aceptables)', totalVerdes, `${Math.round((totalVerdes / (estudiantesFiltrados.length || 1)) * 100)}%`, 'NORMAL']);
  rowVerde.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
  rowVerde.getCell(1).font = { color: { argb: 'FF166534' }, bold: true };

  const rowGris = wsResumen.addRow(['Sin Diagnóstico / Información Pendiente', totalSinDatos, `${Math.round((totalSinDatos / (estudiantesFiltrados.length || 1)) * 100)}%`, 'REVISIÓN']);

  // TABLA DE AYUDAS ENTREGADAS
  const startRowAyudas = 16;
  wsResumen.getCell(`A${startRowAyudas}`).value = '2. TOTAL DE AYUDAS HUMANITARIAS ENTREGADAS';
  wsResumen.getCell(`A${startRowAyudas}`).font = { bold: true, size: 11, color: { argb: 'FF15803D' } };

  wsResumen.getRow(startRowAyudas + 1).values = ['Categoría de Ayuda', 'Kits / Raciones Entregadas', '% del Total de Entregas'];
  wsResumen.getRow(startRowAyudas + 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsResumen.getRow(startRowAyudas + 1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: 'center' };
  });

  wsResumen.addRow(['Alimentos / Mercados / Agua Potable', totAlimentos, `${granTotalAyudas > 0 ? Math.round((totAlimentos / granTotalAyudas) * 100) : 0}%`]);
  wsResumen.addRow(['Medicamentos / Atención en Salud', totMedicamentos, `${granTotalAyudas > 0 ? Math.round((totMedicamentos / granTotalAyudas) * 100) : 0}%`]);
  wsResumen.addRow(['Ropa, Calzado y Cobijas', totRopa, `${granTotalAyudas > 0 ? Math.round((totRopa / granTotalAyudas) * 100) : 0}%`]);
  wsResumen.addRow(['Acompañamiento y Apoyo Psicológico', totEmocional, `${granTotalAyudas > 0 ? Math.round((totEmocional / granTotalAyudas) * 100) : 0}%`]);
  wsResumen.addRow(['Materiales Techo / Construcción', totConstruccion, `${granTotalAyudas > 0 ? Math.round((totConstruccion / granTotalAyudas) * 100) : 0}%`]);
  
  const rowTotAyudas = wsResumen.addRow(['GRAN TOTAL DE KITS ENTREGADOS', granTotalAyudas, '100%']);
  rowTotAyudas.font = { bold: true };
  rowTotAyudas.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
  });

  // SI ES REPORTE GENERAL: AGREGAR TABLA DE DESGLOSE POR GRADOS
  if (esGeneral) {
    const startRowGrados = startRowAyudas + 9;
    wsResumen.getCell(`A${startRowGrados}`).value = '3. DISTRIBUCIÓN ESTADÍSTICA POR GRADOS ESCOLARES';
    wsResumen.getCell(`A${startRowGrados}`).font = { bold: true, size: 11, color: { argb: 'FF15803D' } };

    wsResumen.getRow(startRowGrados + 1).values = [
      'Grado Escolar',
      'Total Estudiantes',
      'Críticos (Rojo)',
      'Alerta (Naranja)',
      'Estables (Verde)',
      'Total Ayudas Entregadas'
    ];
    wsResumen.getRow(startRowGrados + 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsResumen.getRow(startRowGrados + 1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_VERDE_HEADER } };
      cell.alignment = { horizontal: 'center' };
    });

    gradosUnicos.forEach((g) => {
      const enGrado = todosLosEstudiantes.filter((e) => e.grado === g);
      const r = enGrado.filter((e) => e.nivel_urgencia === 'rojo').length;
      const n = enGrado.filter((e) => e.nivel_urgencia === 'naranja').length;
      const v = enGrado.filter((e) => e.nivel_urgencia === 'verde').length;
      const totalA = enGrado.reduce((acc, e) => {
        const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
        return acc + (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0);
      }, 0);

      wsResumen.addRow([`Grado ${g}`, enGrado.length, r, n, v, `${totalA} kits`]);
    });
  }

  // Ajustar anchos de columnas del resumen
  wsResumen.columns = [
    { width: 38 },
    { width: 28 },
    { width: 22 },
    { width: 22 },
    { width: 20 },
    { width: 24 },
    { width: 20 }
  ];

  // ----------------------------------------------------
  // HOJA 2: LISTA DETALLADA DE ESTUDIANTES
  // ----------------------------------------------------
  const wsEstudiantes = workbook.addWorksheet(
    esGeneral ? 'Estudiantes - Censo Completo' : `Estudiantes - Grado ${grado}`
  );

  const headerEstudiantes = [
    'N°',
    'Primer Apellido',
    'Nombre Completo',
    'Grado',
    'Nivel Urgencia',
    'Teléfono',
    'Nombre Acudiente',
    'Ubicación / Sector',
    'Dirección Residencia',
    'Ayuda Prioritaria Solicitada',
    'Alimentos',
    'Medicamentos',
    'Ropa',
    'Emocional',
    'Construcción',
    'Total Ayudas Recibidas',
    'Condición Vivienda',
    'Conectividad / Dispositivos',
    'Salud Emocional',
    'Lesiones Físicas'
  ];

  wsEstudiantes.addRow(headerEstudiantes);
  const rowHeaderEst = wsEstudiantes.getRow(1);
  rowHeaderEst.height = 28;
  rowHeaderEst.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  rowHeaderEst.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_VERDE_HEADER } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  listaOrdenada.forEach((e, idx) => {
    const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
    const totalA = (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0);

    // Extraer primer apellido
    const partes = (e.nombre_estudiante || '').trim().split(/\s+/);
    const primerApellido = partes.length > 0 ? partes[0] : '';

    let urgenciaTexto = 'Sin Diagnóstico';
    if (e.nivel_urgencia === 'rojo') urgenciaTexto = 'CRÍTICO (ROJO)';
    else if (e.nivel_urgencia === 'naranja') urgenciaTexto = 'ALERTA (NARANJA)';
    else if (e.nivel_urgencia === 'verde') urgenciaTexto = 'ESTABLE (VERDE)';

    const row = wsEstudiantes.addRow([
      idx + 1,
      primerApellido,
      e.nombre_estudiante,
      e.grado,
      urgenciaTexto,
      e.telefono || 'Sin registrar',
      e.nombre_acudiente || 'Sin registrar',
      e.ubicacion || '',
      e.direccion || '',
      e.ayuda_prioritaria || 'Ninguna especificada',
      a.Alimento || 0,
      a.Medicamento || 0,
      a.Ropa || 0,
      a.Emocional || 0,
      a.Construccion || 0,
      totalA,
      e.condicion_vivienda || '',
      e.conectividad || '',
      e.salud_emocional || '',
      e.leciones_fisicas || ''
    ]);

    row.height = 20;

    // Aplicar estilos a celdas
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Columna de Urgencia (col 5)
      if (colNumber === 5) {
        if (e.nivel_urgencia === 'rojo') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { color: { argb: 'FF991B1B' }, bold: true, size: 9 };
        } else if (e.nivel_urgencia === 'naranja') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
          cell.font = { color: { argb: 'FF9A3412' }, bold: true, size: 9 };
        } else if (e.nivel_urgencia === 'verde') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          cell.font = { color: { argb: 'FF166534' }, bold: true, size: 9 };
        }
      }

      // Columnas numéricas de ayudas (col 11 a 16)
      if (colNumber >= 11 && colNumber <= 16) {
        cell.alignment = { horizontal: 'center' };
        if (colNumber === 16 && totalA > 0) {
          cell.font = { bold: true, color: { argb: 'FF15803D' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
        }
      }
    });
  });

  // Ajustar anchos automáticos
  wsEstudiantes.columns = [
    { width: 5 },  // N°
    { width: 16 }, // Primer Apellido
    { width: 30 }, // Nombre Completo
    { width: 10 }, // Grado
    { width: 18 }, // Urgencia
    { width: 15 }, // Teléfono
    { width: 25 }, // Acudiente
    { width: 20 }, // Ubicación
    { width: 25 }, // Dirección
    { width: 32 }, // Ayuda Solicitada
    { width: 11 }, // Alimentos
    { width: 14 }, // Medicamentos
    { width: 10 }, // Ropa
    { width: 12 }, // Emocional
    { width: 14 }, // Construcción
    { width: 18 }, // Total Recibidas
    { width: 28 }, // Vivienda
    { width: 28 }, // Conectividad
    { width: 22 }, // Salud emocional
    { width: 20 }  // Lesiones
  ];

  // ----------------------------------------------------
  // HOJA 3: HISTORIAL DETALLADO DE ENTREGAS
  // ----------------------------------------------------
  const wsHistorial = workbook.addWorksheet('Historial de Entregas');
  wsHistorial.addRow([
    'N°',
    'Fecha Entrega',
    'Estudiante Beneficiario',
    'Grado',
    'Tipo de Ayuda',
    'Cantidad (Kits/Raciones)',
    'Responsable de Entrega',
    'Observaciones'
  ]);

  const rowHeaderHist = wsHistorial.getRow(1);
  rowHeaderHist.height = 26;
  rowHeaderHist.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  rowHeaderHist.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let countHist = 1;
  listaOrdenada.forEach((e) => {
    if (e.historial_ayudas && e.historial_ayudas.length > 0) {
      e.historial_ayudas.forEach((item) => {
        const row = wsHistorial.addRow([
          countHist++,
          item.fecha,
          e.nombre_estudiante,
          e.grado,
          item.tipo,
          item.cantidad || 1,
          item.responsable || 'Comité Gidelca',
          item.observaciones || ''
        ]);
        row.eachCell((c) => {
          c.font = { name: 'Arial', size: 9 };
          c.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });
    }
  });

  wsHistorial.columns = [
    { width: 6 },
    { width: 14 },
    { width: 30 },
    { width: 10 },
    { width: 16 },
    { width: 16 },
    { width: 22 },
    { width: 35 }
  ];

  // Escribir buffer y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const nombreArchivo = esGeneral
    ? `Reporte_General_Censo_Gidelca_${getFileTimestamp()}.xlsx`
    : `Reporte_Grado_${grado.replace(/[^a-zA-Z0-9]/g, '_')}_Censo_Gidelca_${getFileTimestamp()}.xlsx`;

  downloadBlob(blob, nombreArchivo);
}

/**
 * EXPORTAR REPORTE A PDF (.PDF)
 * Formato institucional de alta calidad con jspdf y jspdf-autotable
 * Soporta reporte General (todos los grados) o por Grado escolar individual
 */
export function exportarReportePDF(
  todosLosEstudiantes: EstudianteReporte[],
  opciones: {
    grado?: string;
    tituloInstitucion?: string;
    subtitulo?: string;
  } = {}
) {
  const {
    grado = 'Todos',
    tituloInstitucion = 'Gimnasio del Calima',
    subtitulo
  } = opciones;
  const esGeneral = grado === 'Todos' || !grado;

  const estudiantesFiltrados = esGeneral
    ? todosLosEstudiantes
    : todosLosEstudiantes.filter((e) => e.grado === grado);

  const listaOrdenada = ordenarEstudiantesPorPrimerApellido(estudiantesFiltrados);
  const gradosUnicos = ordenarGradosEscolares(
    Array.from(new Set(todosLosEstudiantes.map((e) => e.grado))).filter(Boolean) as string[]
  );

  // Crear documento PDF horizontal (Landscape) para máxima legibilidad de tablas
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. BANNER SUPERIOR INSTITUCIONAL
  doc.setFillColor(21, 128, 61); // #15803D (Verde institucional)
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Franja decorativa amarilla
  doc.setFillColor(250, 204, 21); // #FACC15
  doc.rect(0, 24, pageWidth, 2.5, 'F');

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(
    `${tituloInstitucion.toUpperCase()} • CENSO ESTUDIANTIL Y GESTIÓN DE AYUDAS`,
    14,
    11
  );

  // Subtítulo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const txtSub = subtitulo || (esGeneral
    ? 'INFORME ESTADÍSTICO CONSOLIDADO GENERAL (TODOS LOS GRADOS)'
    : `REPORTE OFICIAL Y DETALLADO - GRADO ${grado.toUpperCase()}`);
  doc.text(txtSub, 14, 18);

  // Fecha en la esquina derecha del banner
  doc.setFontSize(8.5);
  doc.text(`Fecha de Emisión: ${getFileTimestamp()}`, pageWidth - 14, 11, { align: 'right' });
  doc.text(`Total Censados: ${estudiantesFiltrados.length} estudiantes`, pageWidth - 14, 18, { align: 'right' });

  // Cálculos estadísticos
  const totalRojos = estudiantesFiltrados.filter((e) => e.nivel_urgencia === 'rojo').length;
  const totalNaranjas = estudiantesFiltrados.filter((e) => e.nivel_urgencia === 'naranja').length;
  const totalVerdes = estudiantesFiltrados.filter((e) => e.nivel_urgencia === 'verde').length;
  const totalSinDatos = estudiantesFiltrados.filter((e) => !e.nivel_urgencia || e.nivel_urgencia === 'gris').length;

  let totAlimentos = 0;
  let totMedicamentos = 0;
  let totRopa = 0;
  let totEmocional = 0;
  let totConstruccion = 0;

  estudiantesFiltrados.forEach((e) => {
    const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
    totAlimentos += a.Alimento || 0;
    totMedicamentos += a.Medicamento || 0;
    totRopa += a.Ropa || 0;
    totEmocional += a.Emocional || 0;
    totConstruccion += a.Construccion || 0;
  });
  const granTotalAyudas = totAlimentos + totMedicamentos + totRopa + totEmocional + totConstruccion;

  const estudiantesAtendidos = estudiantesFiltrados.filter((e) => {
    const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
    return (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0) > 0;
  }).length;

  // 2. BLOQUE DE TARJETAS / MÉTRICAS CLAVE (KPIs)
  const yKpi = 32;
  const kpiWidth = (pageWidth - 28 - 20) / 5;
  const kpiHeight = 15;

  const kpis = [
    { label: 'CENSO EVALUADO', val: `${estudiantesFiltrados.length}`, color: [15, 23, 42], bg: [241, 245, 249] },
    { label: 'CRÍTICOS (ROJO)', val: `${totalRojos}`, color: [185, 28, 28], bg: [254, 226, 226] },
    { label: 'ALERTA (NARANJA)', val: `${totalNaranjas}`, color: [194, 65, 12], bg: [255, 237, 213] },
    { label: 'ESTABLES (VERDE)', val: `${totalVerdes}`, color: [21, 128, 61], bg: [220, 252, 231] },
    { label: 'AYUDAS ENTREGADAS', val: `${granTotalAyudas} kits`, color: [146, 64, 14], bg: [254, 240, 138] }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (kpiWidth + 5);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.roundedRect(x, yKpi, kpiWidth, kpiHeight, 2, 2, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.label, x + kpiWidth / 2, yKpi + 4.5, { align: 'center' });

    doc.setFontSize(11);
    doc.text(kpi.val, x + kpiWidth / 2, yKpi + 11.5, { align: 'center' });
  });

  // 3. TABLA RESUMEN POR GRADOS (Si es general)
  let currentY = yKpi + kpiHeight + 5;

  if (esGeneral) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('RESUMEN DE VULNERABILIDAD Y AYUDAS POR GRADO ESCOLAR', 14, currentY + 3);

    const bodyGrados = gradosUnicos.map((g) => {
      const enGrado = todosLosEstudiantes.filter((e) => e.grado === g);
      const r = enGrado.filter((e) => e.nivel_urgencia === 'rojo').length;
      const n = enGrado.filter((e) => e.nivel_urgencia === 'naranja').length;
      const v = enGrado.filter((e) => e.nivel_urgencia === 'verde').length;
      const totalA = enGrado.reduce((acc, e) => {
        const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
        return acc + (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0);
      }, 0);

      return [`Grado ${g}`, `${enGrado.length}`, `${r}`, `${n}`, `${v}`, `${totalA} kits`];
    });

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Grado Escolar', 'Estudiantes', 'Críticos (Rojo)', 'Alerta (Naranja)', 'Estables (Verde)', 'Ayudas Entregadas']],
      body: bodyGrados,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.5,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [21, 128, 61],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
        1: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center', textColor: [185, 28, 28], fontStyle: 'bold' },
        3: { halign: 'center', textColor: [194, 65, 12], fontStyle: 'bold' },
        4: { halign: 'center', textColor: [21, 128, 61], fontStyle: 'bold' },
        5: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    // Actualizar currentY después de la tabla de grados
    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 25;
    currentY = finalY + 6;
  }

  // 4. TABLA DETALLADA DE ESTUDIANTES
  // Si no cabe en la misma página, jspdf-autotable salta automáticamente a la siguiente página
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  if (esGeneral && currentY > pageHeight - 40) {
    doc.addPage('landscape');
    currentY = 16;
  }

  doc.text(
    esGeneral
      ? 'LISTADO DETALLADO DE ESTUDIANTES CENSADOS (ORDENADO ALFABÉTICAMENTE POR APELLIDO)'
      : `LISTADO DETALLADO DE ESTUDIANTES - GRADO ${grado.toUpperCase()}`,
    14,
    currentY + 2
  );

  const tableBody = listaOrdenada.map((e, idx) => {
    const a = e.ayudas_entregadas || { Alimento: 0, Medicamento: 0, Ropa: 0, Emocional: 0, Construccion: 0 };
    const totalA = (a.Alimento || 0) + (a.Medicamento || 0) + (a.Ropa || 0) + (a.Emocional || 0) + (a.Construccion || 0);

    let urgencia = 'Sin Datos';
    if (e.nivel_urgencia === 'rojo') urgencia = 'CRÍTICO';
    else if (e.nivel_urgencia === 'naranja') urgencia = 'ALERTA';
    else if (e.nivel_urgencia === 'verde') urgencia = 'ESTABLE';

    const ayudaResumen = totalA > 0 ? `${totalA} kits` : '0';

    return [
      `${idx + 1}`,
      e.nombre_estudiante,
      e.grado,
      urgencia,
      e.telefono || 'Sin reg.',
      e.nombre_acudiente || 'Sin reg.',
      (e.direccion || e.ubicacion || '').substring(0, 30),
      (e.ayuda_prioritaria || 'Ninguna').substring(0, 32),
      ayudaResumen,
      (e.conectividad || '').substring(0, 24)
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [
      [
        'N°',
        'Nombre del Estudiante',
        'Grado',
        'Urgencia',
        'Teléfono',
        'Acudiente',
        'Dirección / Sector',
        'Ayuda Prioritaria Solicitada',
        'Ayudas Recibidas',
        'Conectividad'
      ]
    ],
    body: tableBody,
    theme: 'striped',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 22 },
      5: { cellWidth: 36 },
      6: { cellWidth: 38 },
      7: { cellWidth: 42 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      9: { cellWidth: 22 }
    },
    didParseCell: (data) => {
      // Colorear celda de Urgencia
      if (data.section === 'body' && data.column.index === 3) {
        const text = String(data.cell.raw);
        if (text === 'CRÍTICO') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fillColor = [254, 226, 226];
        } else if (text === 'ALERTA') {
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fillColor = [255, 237, 213];
        } else if (text === 'ESTABLE') {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fillColor = [220, 252, 231];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  // Pie de página en todas las hojas
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Documento emitido por la Plataforma de Censo • ${tituloInstitucion} • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const nombreArchivo = esGeneral
    ? `Reporte_General_Censo_Gidelca_${getFileTimestamp()}.pdf`
    : `Reporte_Grado_${grado.replace(/[^a-zA-Z0-9]/g, '_')}_Censo_Gidelca_${getFileTimestamp()}.pdf`;

  doc.save(nombreArchivo);
}
