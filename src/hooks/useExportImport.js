import { downloadEntriesCsv } from '../utils/csv.js';
import { showToast } from '../utils/toast.js';
import { showConfirm } from '../utils/confirmDialog.js';
import { exportToJson, importFromJson, exportToExcel, exportToPdf } from '../utils/exportImport.js';

export function useExportImport({ visibleEntries, addEntry }) {
  async function handleExportJson() {
    try {
      const json = exportToJson(visibleEntries);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Journal exportado como JSON', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Error al exportar JSON', { type: 'error' });
    }
  }

  async function handleExportExcel() {
    try {
      const blob = await exportToExcel(visibleEntries);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Journal exportado como Excel', { type: 'success' });
    } catch (err) {
      console.error(err);
      try {
        downloadEntriesCsv(visibleEntries, `journal-${new Date().toISOString().slice(0, 10)}.csv`);
        showToast('Exportado como CSV (Excel no disponible)', { type: 'info' });
      } catch (fallbackErr) {
        showToast('Error al exportar', { type: 'error' });
      }
    }
  }

  async function handleExportPdf() {
    try {
      const blob = await exportToPdf(visibleEntries);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journal-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Journal exportado como PDF', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Error al exportar PDF', { type: 'error' });
    }
  }

  async function handleImportClick() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        let entries = [];
        if (file.name.endsWith('.json')) {
          const text = await file.text();
          const data = importFromJson(text);
          entries = data.entries;
        } else if (file.name.endsWith('.csv')) {
          const text = await file.text();
          const lines = text.split('\n');
          if (lines.length < 2) throw new Error('CSV file is empty or invalid');

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map((v) => v.trim());
            if (values.length >= 10) {
              const entry = {
                date: values[0],
                contract: values[1],
                contracts: parseInt(values[2]) || 1,
                slPoints: parseFloat(values[3]) || 0,
                tpPoints: parseFloat(values[4]) || 0,
                riskDollars: parseFloat(values[5].replace('$', '')) || 0,
                rewardDollars: parseFloat(values[6].replace('$', '')) || 0,
                rr: values[7] ? parseFloat(values[7]) : null,
                realPnl: values[8] ? (values[8] === '' ? null : parseFloat(values[8])) : null,
                tags: values[9] ? values[9].split(';').map((t) => t.trim()).filter((t) => t) : [],
                outcome: values[10] || 'pending',
                followedPlan: values[11] || 'yes',
                rating: parseInt(values[12]) || 0,
                notes: values[13] || '',
              };
              entries.push(entry);
            }
          }
        }

        if (entries.length === 0) {
          showToast('No se encontraron operaciones válidas en el archivo', { type: 'warning' });
          return;
        }

        const confirmed = await showConfirm({
          title: 'Importar operaciones',
          message: `¿Importar ${entries.length} operaciones? Se agregarán a tu journal existente.`,
          confirmLabel: 'Importar',
          danger: false,
        });

        if (!confirmed) return;

        let successCount = 0;
        for (const entry of entries) {
          try {
            await addEntry(entry);
            successCount++;
          } catch (entryError) {
            console.error('Error importing entry:', entryError);
          }
        }

        showToast(`Importadas ${successCount} de ${entries.length} operaciones`, {
          type: successCount === entries.length ? 'success' : 'warning',
        });
      } catch (err) {
        console.error(err);
        showToast('Error al importar el archivo', { type: 'error' });
      }
    };

    input.click();
  }

  return { handleExportJson, handleExportExcel, handleExportPdf, handleImportClick };
}
