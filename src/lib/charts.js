import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export const chartPalette = {
  accent: '#1f6a52',
  accentSoft: 'rgba(31, 106, 82, 0.2)',
  warm: '#bc6c25',
  softStrong: '#7f9f90',
  grid: 'rgba(53, 67, 59, 0.1)',
  text: '#45504a'
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        color: chartPalette.text,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          family: 'Manrope, sans-serif',
          size: 12,
          weight: '600'
        }
      }
    },
    tooltip: {
      backgroundColor: '#1d2421',
      titleFont: {
        family: 'Manrope, sans-serif',
        weight: '700'
      },
      bodyFont: {
        family: 'Manrope, sans-serif'
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: chartPalette.text,
        font: {
          family: 'Manrope, sans-serif',
          size: 11
        }
      },
      grid: {
        display: false
      },
      border: {
        color: chartPalette.grid
      }
    },
    y: {
      ticks: {
        color: chartPalette.text,
        font: {
          family: 'Manrope, sans-serif',
          size: 11
        }
      },
      grid: {
        color: chartPalette.grid
      },
      border: {
        color: chartPalette.grid
      }
    }
  }
};

export function mountChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return null;
  }

  if (canvas.__chartInstance) {
    canvas.__chartInstance.destroy();
  }

  const chart = new Chart(canvas, config);
  canvas.__chartInstance = chart;
  return chart;
}
