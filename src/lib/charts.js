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
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  },
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
      beginAtZero: true,
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

function getAnimatedConfig(config) {
  const type = config?.type;
  const options = config?.options || {};
  const animatedOptions = {
    ...options
  };

  if (type === 'line') {
    animatedOptions.animation = {
      ...(options.animation || {}),
      duration: 0
    };
    animatedOptions.animations = {
      ...(options.animations || {}),
      x: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: 700,
        from: NaN,
        delay(context) {
          if (context.type !== 'data' || context.xStarted) {
            return 0;
          }
          context.xStarted = true;
          return context.index * 90;
        }
      },
      y: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: 700,
        from(context) {
          return context.chart.scales.y.getPixelForValue(0);
        },
        delay(context) {
          if (context.type !== 'data' || context.yStarted) {
            return 0;
          }
          context.yStarted = true;
          return context.index * 90;
        }
      }
    };
  } else if (type === 'bar') {
    animatedOptions.animation = {
      ...(options.animation || {}),
      duration: 0
    };
    animatedOptions.animations = {
      ...(options.animations || {}),
      y: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: 700,
        from(context) {
          return context.chart.scales.y.getPixelForValue(0);
        },
        delay(context) {
          if (context.type !== 'data' || context.yStarted) {
            return 0;
          }
          context.yStarted = true;
          return (context.dataIndex * 70) + (context.datasetIndex * 120);
        }
      }
    };
  } else if (type === 'doughnut' || type === 'pie') {
    const sweepDuration = options.animation?.duration || 1100;
    const resolveSweepDelay = (context) => {
      if (context.type !== 'data' || context.sweepStarted) {
        return 0;
      }
      context.sweepStarted = true;
      return context.dataIndex * 120;
    };
    const resolveRotation = (context) => (
      context.chart.getDatasetMeta(context.datasetIndex).controller._getRotation()
    );

    animatedOptions.animation = {
      ...(options.animation || {}),
      duration: 0,
      animateRotate: false,
      animateScale: false
    };
    animatedOptions.animations = {
      ...(options.animations || {}),
      circumference: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: sweepDuration,
        from: 0,
        delay: resolveSweepDelay
      },
      startAngle: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: sweepDuration,
        from: resolveRotation,
        delay: resolveSweepDelay
      },
      endAngle: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: sweepDuration,
        from: resolveRotation,
        delay: resolveSweepDelay
      }
    };
  }

  return {
    ...config,
    options: animatedOptions
  };
}

export function mountChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return null;
  }

  if (canvas.__chartInstance) {
    canvas.__chartInstance.destroy();
  }

  const chart = new Chart(canvas, getAnimatedConfig(config));
  canvas.__chartInstance = chart;
  return chart;
}
