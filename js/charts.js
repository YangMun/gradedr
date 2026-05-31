/* ============================================================
   GradeR - Charts Module
   Feature 4: Chart.js bar / line / donut visualizations.
   Lazy-initialized on first section visit to save resources.
   ============================================================ */

import { getSemesters, getSubjects } from './storage.js';
import { calcGpa } from './calculator.js';
import { getGradeTier } from './gradeScale.js';

// Chart instance registry — prevents memory leaks on re-render
const _charts = new Map();

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getChartColors() {
  return {
    a:    getCssVar('--color-chart-a')    || '#4361ee',
    b:    getCssVar('--color-chart-b')    || '#7209b7',
    c:    getCssVar('--color-chart-c')    || '#f59e0b',
    d:    getCssVar('--color-chart-d')    || '#ef4444',
    f:    getCssVar('--color-chart-f')    || '#9ca3af',
    text: getCssVar('--color-text-secondary') || '#6b7280',
    grid: getCssVar('--color-border')     || '#dde1ef',
    accent: getCssVar('--color-accent')   || '#4361ee'
  };
}

function destroyChart(id) {
  const existing = _charts.get(id);
  if (existing) { existing.destroy(); _charts.delete(id); }
}

function emptyMessage(canvas, message) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const colors = getChartColors();
  ctx.font = `14px ${getCssVar('--font-base') || 'sans-serif'}`;
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// ── Bar Chart: grades per subject (current semester) ─────────

export function renderBarChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  destroyChart(canvasId);

  // Collect all subjects across all semesters
  const semesters = getSemesters();
  const allSubjects = semesters.flatMap(s =>
    s.subjects.map(sub => ({ ...sub, semLabel: s.label }))
  );

  if (allSubjects.length === 0) {
    emptyMessage(canvas, '아직 과목 데이터가 없어요');
    return;
  }

  const colors  = getChartColors();
  const labels  = allSubjects.map(s => s.name.length > 6 ? s.name.slice(0, 6) + '…' : s.name);
  const data    = allSubjects.map(s => s.points);
  const bgColors = allSubjects.map(s => {
    const tier = getGradeTier(s.grade);
    return colors[tier.toLowerCase()] || colors.f;
  });

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '성적 (GPA)',
        data,
        backgroundColor: bgColors.map(c => c + 'cc'),
        borderColor: bgColors,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const s = allSubjects[ctx.dataIndex];
              return ` ${s.grade} (${s.points.toFixed(1)}) · ${s.credits}학점`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.text, font: { size: 11 }, maxRotation: 45 },
          grid:  { color: colors.grid + '40' }
        },
        y: {
          min: 0,
          max: 4.5,
          ticks: { color: colors.text, stepSize: 0.5 },
          grid:  { color: colors.grid + '60' }
        }
      }
    }
  });

  _charts.set(canvasId, chart);
}

// ── Line Chart: GPA trend by semester ────────────────────────

export function renderLineChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  destroyChart(canvasId);

  const semesters = getSemesters().filter(s => s.subjects.length > 0);

  if (semesters.length < 2) {
    emptyMessage(canvas, '2개 이상의 학기 데이터가 있어야 표시돼요');
    return;
  }

  const colors = getChartColors();
  const labels = semesters.map(s => s.label);
  const data   = semesters.map(s => parseFloat(calcGpa(s.subjects).gpa.toFixed(2)));

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '학기 평점',
        data,
        borderColor: colors.accent,
        backgroundColor: colors.accent + '22',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: colors.accent,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} 학점` }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.text, font: { size: 11 } },
          grid:  { color: colors.grid + '40' }
        },
        y: {
          min: 0,
          max: 4.5,
          ticks: { color: colors.text, stepSize: 0.5 },
          grid:  { color: colors.grid + '60' }
        }
      }
    }
  });

  _charts.set(canvasId, chart);
}

// ── Donut Chart: grade tier distribution ─────────────────────

export function renderDonutChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  destroyChart(canvasId);

  const allSubjects = getSemesters().flatMap(s => s.subjects);

  if (allSubjects.length === 0) {
    emptyMessage(canvas, '아직 과목 데이터가 없어요');
    return;
  }

  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  allSubjects.forEach(s => { counts[getGradeTier(s.grade)]++; });

  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  const colors  = getChartColors();

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: entries.map(([k]) => k + '학점'),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map(([k]) => (colors[k.toLowerCase()] || colors.f) + 'cc'),
        borderColor: entries.map(([k]) => colors[k.toLowerCase()] || colors.f),
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colors.text,
            font: { size: 12 },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.parsed / total) * 100).toFixed(0);
              return ` ${ctx.parsed}과목 (${pct}%)`;
            }
          }
        }
      }
    }
  });

  _charts.set(canvasId, chart);
}

// ── Public: render all three + re-render on theme change ─────

export function renderAllCharts() {
  renderBarChart('chart-bar');
  renderLineChart('chart-line');
  renderDonutChart('chart-donut');
}

export function destroyAllCharts() {
  _charts.forEach(c => c.destroy());
  _charts.clear();
}

// ── Init: lazy render when charts section becomes visible ────

let _chartsRendered = false;

export function initCharts() {
  window.addEventListener('gradedr:section-change', ({ detail }) => {
    if (detail.sectionId === 'section-charts') {
      // Always re-render to pick up new data and current theme colors
      renderAllCharts();
      _chartsRendered = true;
    }
  });

  // Re-render on theme toggle so colors match new theme
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    if (_chartsRendered) {
      // Small delay so CSS variables are updated first
      setTimeout(renderAllCharts, 50);
    }
  });
}
