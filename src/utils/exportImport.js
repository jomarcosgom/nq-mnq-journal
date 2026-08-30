/**
 * Utility functions for exporting and importing journal data
 * Supports JSON, CSV, Excel, and PDF formats
 */

import { entriesToCsv } from './csv.js';
import { computeStats } from './stats.js';
import { getEntryTags, collectAllTags } from './tags.js';

/**
 * Export journal entries to JSON format
 * @param {Array} entries - Array of journal entries
 * @param {Object} options - Export options
 * @returns {string} JSON string
 */
export function exportToJson(entries, options = {}) {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    entries: entries.map(entry => ({
      ...entry,
      // Ensure date is in ISO string format
      date: entry.date instanceof Date ? entry.date.toISOString() : entry.date
    })),
    stats: computeStats(entries),
    metadata: {
      totalEntries: entries.length,
      tags: collectAllTags(entries),
      dateRange: calculateDateRange(entries)
    }
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import journal entries from JSON format
 * @param {string} jsonString - JSON string to parse
 * @returns {Object} Parsed data with entries and metadata
 * @throws {Error} If JSON is invalid or missing required fields
 */
export function importFromJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.entries || !Array.isArray(data.entries)) {
      throw new Error('Invalid journal data: missing or invalid entries array');
    }

    // Validate each entry has required fields
    data.entries.forEach((entry, index) => {
      if (!entry.date) {
        throw new Error(`Entry ${index} is missing required date field`);
      }
      if (!entry.contract) {
        throw new Error(`Entry ${index} is missing required contract field`);
      }
    });

    // Convert date strings back to Date objects for consistency if needed
    const processedEntries = data.entries.map(entry => ({
      ...entry,
      date: entry.date instanceof Date ? entry.date : new Date(entry.date)
    }));

    return {
      entries: processedEntries,
      stats: data.stats || computeStats(processedEntries),
      metadata: data.metadata || {}
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

/**
 * Export journal entries to Excel format (requires xlsx library)
 * @param {Array} entries - Array of journal entries
 * @returns {Promise<Blob>} Excel file as Blob
 */
export async function exportToExcel(entries) {
  try {
    // Dynamically import xlsx to avoid bundling if not used
    const XLSX = await import('xlsx');

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Trades sheet
    const tradesData = [
      ['Fecha', 'Contrato', 'Contratos', 'SL (pts)', 'TP (pts)',
       'Riesgo ($)', 'Beneficio ($)', 'R:R', 'P&L real ($)',
       'Tags', 'Resultado', 'Siguió el plan', 'Rating', 'Notas']
    ];

    entries.forEach(entry => {
      tradesData.push([
        entry.date,
        entry.contract,
        entry.contracts,
        entry.slPoints,
        entry.tpPoints,
        entry.riskDollars,
        entry.rewardDollars,
        entry.rr !== null && entry.rr !== undefined ? entry.rr.toFixed(2) : '',
        entry.realPnl !== null && entry.realPnl !== undefined ? entry.realPnl : '',
        getEntryTags(entry).join('; '),
        entry.outcome || 'pending',
        entry.followedPlan || '',
        entry.rating || '',
        entry.notes || ''
      ]);
    });

    const tradesWs = XLSX.utils.aoa_to_sheet(tradesData);
    XLSX.utils.book_append_sheet(wb, tradesWs, 'Trades');

    // Stats sheet
    const stats = computeStats(entries);
    const statsData = [
      ['Métrica', 'Valor'],
      ['P&L Neto', stats.netPnl !== null ? `$${stats.netPnl.toFixed(2)}` : '$0.00'],
      ['Tasa de Ganancia', stats.winRate !== null ? `${stats.winRate.toFixed(1)}%` : 'N/A'],
      ['Expectativa', stats.expectancy !== null ? `$${stats.expectancy.toFixed(2)}` : '$0.00'],
      ['Factor de Ganancia', stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : 'N/A'],
      ['Racha Actual', `${stats.streak} ${stats.streakType || ''}`],
      ['Mejor Racha Ganadora', stats.maxWinStreak],
      ['Mejor Racha Perdedora', stats.maxLossStreak],
      ['Drawdown Máximo', stats.maxDrawdown !== null ? `$${stats.maxDrawdown.toFixed(2)}` : '$0.00'],
      ['Mejor Operación', stats.bestTrade !== null ? `$${stats.bestTrade.toFixed(2)}` : '$0.00'],
      ['Peor Operación', stats.worstTrade !== null ? `$${stats.worstTrade.toFixed(2)}` : '$0.00'],
      ['Ganancia Promedio', stats.avgWin !== null ? `$${stats.avgWin.toFixed(2)}` : '$0.00'],
      ['Pérdida Promedio', stats.avgLoss !== null ? `$${stats.avgLoss.toFixed(2)}` : '$0.00'],
      ['Ratio Ganancia/Pérdida', stats.avgWinLossRatio !== null ? stats.avgWinLossRatio.toFixed(2) : 'N/A'],
      ['Cumplimiento del Plan', stats.planRate !== null ? `${stats.planRate.toFixed(1)}%` : 'N/A'],
      ['Puntuación Compuesta', stats.score !== null ? `${stats.score}` : 'N/A']
    ];

    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, 'Estadísticas');

    // Tags sheet
    const tags = collectAllTags(entries);
    const tagsData = [['Tag', 'Count']];

    // Count occurrences of each tag
    const tagCounts = {};
    entries.forEach(entry => {
      getEntryTags(entry).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    Object.entries(tagCounts).forEach(([tag, count]) => {
      tagsData.push([tag, count]);
    });

    // Sort by count descending
    tagsData.sort((a, b) => b[1] - a[1]);

    const tagsWs = XLSX.utils.aoa_to_sheet(tagsData);
    XLSX.utils.book_append_sheet(wb, tagsWs, 'Tags');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return blob;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel. Please try CSV or JSON format instead.');
  }
}

/**
 * Export journal statistics to PDF format (requires jspdf library)
 * @param {Array} entries - Array of journal entries
 * @returns {Promise<Blob>} PDF file as Blob
 */
export async function exportToPdf(entries) {
  try {
    // Dynamically import jspdf to avoid bundling if not used
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    const stats = computeStats(entries);

    // Header
    doc.setFontSize(20);
    doc.text('NQ/MNQ Trading Journal Report', 105, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });

    // Stats section
    doc.setFontSize(16);
    doc.text('Performance Statistics', 20, 40);

    const statsStartY = 50;
    const statsData = [
      ['P&L Neto', stats.netPnl !== null ? `$${stats.netPnl.toFixed(2)}` : '$0.00'],
      ['Tasa de Ganancia', stats.winRate !== null ? `${stats.winRate.toFixed(1)}%` : 'N/A'],
      ['Expectativa', stats.expectancy !== null ? `$${stats.expectancy.toFixed(2)}` : '$0.00'],
      ['Factor de Ganancia', stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : 'N/A'],
      ['Racha Actual', `${stats.streak} ${stats.streakType || ''}`],
      ['Mejor Racha Ganadora', stats.maxWinStreak],
      ['Mejor Racha Perdedora', stats.maxLossStreak],
      ['Drawdown Máximo', stats.maxDrawdown !== null ? `$${stats.maxDrawdown.toFixed(2)}` : '$0.00'],
      ['Mejor Operación', stats.bestTrade !== null ? `$${stats.bestTrade.toFixed(2)}` : '$0.00'],
      ['Peor Operación', stats.worstTrade !== null ? `$${stats.worstTrade.toFixed(2)}` : '$0.00'],
      ['Ganancia Promedio', stats.avgWin !== null ? `$${stats.avgWin.toFixed(2)}` : '$0.00'],
      ['Pérdida Promedio', stats.avgLoss !== null ? `$${stats.avgLoss.toFixed(2)}` : '$0.00'],
      ['Ratio Ganancia/Pérdida', stats.avgWinLossRatio !== null ? stats.avgWinLossRatio.toFixed(2) : 'N/A'],
      ['Cumplimiento del Plan', stats.planRate !== null ? `${stats.planRate.toFixed(1)}%` : 'N/A'],
      ['Puntuación Compuesta', stats.score !== null ? `${stats.score}` : 'N/A']
    ];

    let yPos = statsStartY;
    statsData.forEach(([label, value]) => {
      doc.setFontSize(12);
      doc.text(label, 20, yPos);
      doc.text(value, 100, yPos, { align: 'right' });
      yPos += 10;
    });

    // Add chart placeholder or actual chart images if needed
    // For now, we'll add a note about charts
    yPos += 10;
    doc.setFontSize(12);
    doc.text('Note: Charts and visualizations are available in the application interface.', 20, yPos);

    // Generate PDF
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF. Please try other formats instead.');
  }
}

/**
 * Calculate date range of entries
 * @param {Array} entries - Array of journal entries
 * @returns {Object} Date range with start and end dates
 */
function calculateDateRange(entries) {
  if (entries.length === 0) return { start: null, end: null };

  const dates = entries.map(entry => new Date(entry.date));
  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

/**
 * Create a CSV template for import
 * @returns {string} CSV template string
 */
export function createCsvTemplate() {
  const headers = [
    'Fecha', 'Contrato', 'Contratos', 'SL (pts)', 'TP (pts)',
    'Riesgo ($)', 'Beneficio ($)', 'R:R', 'P&L real ($)',
    'Tags', 'Resultado', 'Siguió el plan', 'Rating', 'Notas'
  ];

  // Add example row
  const exampleRow = [
    '2024-01-15T09:30:00', // ISO date string
    'MNQ',
    '1',
    '20',
    '40',
    '$20.00',
    '$40.00',
    '2.00',
    '25.50',
    'Ruptura de rango; FOMO',
    'ganada',
    'sí',
    '4',
    'Buena entrada siguiendo el plan'
  ];

  const csvData = [headers, exampleRow];
  return csvData.map(row =>
    row.map(field => {
      const str = String(field ?? '');
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    }).join(',')
  ).join('\r\n');
}