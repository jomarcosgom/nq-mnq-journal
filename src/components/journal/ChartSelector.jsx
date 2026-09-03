import { useState } from 'react';

const CHART_TYPES = [
  { id: 'equity', label: 'Curva de Capital', icon: '📈' },
  { id: 'drawdown', label: 'Drawdown', icon: '📉' },
  { id: 'monthly', label: 'Retornos Mensuales', icon: '📊' },
  { id: 'distribution', label: 'Distribución P&L', icon: '📈' },
  { id: 'duration', label: 'Duración Operaciones', icon: '⏱️' },
  { id: 'riskreward', label: 'Riesgo vs Recompensa', icon: '⚖️' }
];

export default function ChartSelector({ entries, onChartChange }) {
  const [selectedChart, setSelectedChart] = useState('equity');

  const handleChartChange = (chartId) => {
    setSelectedChart(chartId);
    if (onChartChange) onChartChange(chartId);
  };

  return (
    <div className="chart-selector-wrap">
      <div className="chart-selector-label">
        <span>Tipo de Gráfico:</span>
        <div className="chart-selector-buttons">
          {CHART_TYPES.map((chartType) => (
            <button
              key={chartType.id}
              className={selectedChart === chartType.id ? 'chart-btn active' : 'chart-btn'}
              onClick={() => handleChartChange(chartType.id)}
              title={chartType.label}
            >
              {chartType.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}