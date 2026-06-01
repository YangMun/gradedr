/* ============================================================
   GradeR - Insights Module
   Auto-generates actionable insights from grade data.
   ============================================================ */

import { getSemesters } from './storage.js';
import { calcGpa, calcGpaByType } from './calculator.js';

export function initInsights() {
  renderInsights();
  window.addEventListener('gradedr:data-changed', renderInsights);
  window.addEventListener('gradedr:section-change', e => {
    if (e.detail?.sectionId === 'section-charts') renderInsights();
  });
}

function renderInsights() {
  const container = document.getElementById('insights-container');
  if (!container) return;

  const semesters   = getSemesters();
  const allSubjects = semesters.flatMap(s => s.subjects);

  if (allSubjects.length === 0) {
    container.style.display = 'none';
    return;
  }

  const chips = generateInsights(semesters, allSubjects);
  if (chips.length === 0) { container.style.display = 'none'; return; }

  container.style.display = '';
  container.innerHTML = `
    <div class="insights-grid">
      ${chips.map(({ icon, text, type }) => `
        <div class="insight-chip insight-${type}">
          <i class="ph-bold ${icon}"></i>
          <span>${text}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function generateInsights(semesters, allSubjects) {
  const chips = [];

  // GPA trend over last semesters with data
  const activeSems = semesters.filter(s => s.subjects.length > 0);
  if (activeSems.length >= 3) {
    const gpas   = activeSems.slice(-3).map(s => calcGpa(s.subjects).gpa);
    if (gpas[0] < gpas[1] && gpas[1] < gpas[2]) {
      chips.push({ icon: 'ph-trend-up',   text: 'GPA가 3학기 연속 상승 중이에요', type: 'positive' });
    } else if (gpas[0] > gpas[1] && gpas[1] > gpas[2]) {
      chips.push({ icon: 'ph-trend-down', text: 'GPA가 3학기 연속 하락했어요', type: 'warning' });
    }
  } else if (activeSems.length === 2) {
    const gpas = activeSems.map(s => calcGpa(s.subjects).gpa);
    const diff  = gpas[1] - gpas[0];
    if (diff >  0.05) chips.push({ icon: 'ph-trend-up',   text: `직전 학기보다 +${diff.toFixed(2)}점 올랐어요`, type: 'positive' });
    if (diff < -0.05) chips.push({ icon: 'ph-trend-down', text: `직전 학기보다 ${diff.toFixed(2)}점 내렸어요`, type: 'warning' });
  }

  // Major vs General GPA
  const { major, general } = calcGpaByType(semesters);
  if (major.totalCredits > 0 && general.totalCredits > 0) {
    const diff = major.gpa - general.gpa;
    if (diff > 0.1) {
      chips.push({ icon: 'ph-star', text: `전공 GPA(${major.gpa.toFixed(2)})가 교양(${general.gpa.toFixed(2)})보다 높아요`, type: 'positive' });
    } else if (diff < -0.1) {
      chips.push({ icon: 'ph-info', text: `전공 GPA(${major.gpa.toFixed(2)})가 교양(${general.gpa.toFixed(2)})보다 낮아요`, type: 'neutral' });
    }
  }

  // Total subjects & credits
  const totalCredits = allSubjects.reduce((s, c) => s + c.credits, 0);
  chips.push({ icon: 'ph-books', text: `총 ${allSubjects.length}개 과목 · ${totalCredits}학점 수강`, type: 'neutral' });

  // A+ count
  const apCount = allSubjects.filter(s => s.grade.replace(/^(\d+)점 → /, '') === 'A+').length;
  if (apCount > 0) chips.push({ icon: 'ph-trophy', text: `A+ ${apCount}개 달성`, type: 'positive' });

  // Best semester
  if (activeSems.length > 0) {
    const best = activeSems.reduce((a, b) =>
      calcGpa(a.subjects).gpa >= calcGpa(b.subjects).gpa ? a : b
    );
    const bestGpa = calcGpa(best.subjects).gpa;
    if (activeSems.length > 1) {
      chips.push({ icon: 'ph-medal', text: `최고 학기: ${best.label} (${bestGpa.toFixed(2)})`, type: 'neutral' });
    }
  }

  return chips;
}
