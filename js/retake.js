/* ============================================================
   GradeR - Retake Impact Simulator Module
   Calculates GPA change from retaking a subject.
   ============================================================ */

import { getSemesters } from './storage.js';
import { calcCumulativeGpa } from './calculator.js';
import { buildSelectOptions, getPoints } from './gradeScale.js';

export function initRetake() {
  populateRetakeTargetGrade();
  refresh();

  document.getElementById('retake-subject-select')?.addEventListener('change', calcRetakeImpact);
  document.getElementById('retake-target-grade')?.addEventListener('change', calcRetakeImpact);

  window.addEventListener('gradedr:data-changed', refresh);
  window.addEventListener('gradedr:section-change', e => {
    if (e.detail?.sectionId === 'section-target') refresh();
  });
}

function refresh() {
  populateRetakeSubjectSelect();
  calcRetakeImpact();
  renderRecommendations();
}

// ── Subject Select ────────────────────────────────────────────

function getAllSubjectsWithSem() {
  return getSemesters().flatMap(sem =>
    sem.subjects.map(s => ({ ...s, semName: sem.name }))
  );
}

function populateRetakeSubjectSelect() {
  const select = document.getElementById('retake-subject-select');
  if (!select) return;

  const prevVal  = select.value;
  const subjects = getAllSubjectsWithSem();

  select.innerHTML = '<option value="">— 과목을 선택하세요 —</option>';
  subjects.forEach(s => {
    const gradeLabel = s.grade.replace(/^(\d+)점 → /, '');
    const opt = document.createElement('option');
    opt.value       = s.id;
    opt.textContent = `${s.name} (${s.semName}) · ${gradeLabel}`;
    select.appendChild(opt);
  });

  if (prevVal && [...select.options].some(o => o.value === prevVal)) {
    select.value = prevVal;
  }
}

function populateRetakeTargetGrade() {
  const select = document.getElementById('retake-target-grade');
  if (!select) return;
  select.innerHTML = buildSelectOptions('4.5')
    .map(o => `<option value="${o.value}">${o.label}</option>`)
    .join('');
}

// ── Impact Calculation ────────────────────────────────────────

function calcRetakeImpact() {
  const subjectSelect = document.getElementById('retake-subject-select');
  const gradeSelect   = document.getElementById('retake-target-grade');
  const resultEl      = document.getElementById('retake-result');
  const newGpaEl      = document.getElementById('retake-new-gpa');
  const deltaEl       = document.getElementById('retake-delta');

  if (!subjectSelect || !gradeSelect || !resultEl) return;

  const subjectId = subjectSelect.value;
  if (!subjectId) { resultEl.style.display = 'none'; return; }

  const semesters    = getSemesters();
  const { gpa: cur } = calcCumulativeGpa(semesters);
  const targetPts    = getPoints('4.5', gradeSelect.value);

  const simSemesters = semesters.map(sem => ({
    ...sem,
    subjects: sem.subjects.map(s =>
      s.id === subjectId ? { ...s, points: targetPts } : s
    )
  }));
  const { gpa: newGpa } = calcCumulativeGpa(simSemesters);
  const delta = newGpa - cur;

  resultEl.style.display = '';
  newGpaEl.textContent   = newGpa.toFixed(2);
  deltaEl.textContent    = (delta >= 0 ? '+' : '') + delta.toFixed(2);
  deltaEl.className      = 'retake-delta '
    + (delta > 0.001 ? 'retake-delta-pos' : delta < -0.001 ? 'retake-delta-neg' : 'retake-delta-neu');
}

// ── Recommendations ───────────────────────────────────────────

function renderRecommendations() {
  const container = document.getElementById('retake-recommendations');
  if (!container) return;

  const semesters  = getSemesters();
  const subjects   = getAllSubjectsWithSem();

  if (subjects.length === 0) { container.innerHTML = ''; return; }

  const { gpa: cur } = calcCumulativeGpa(semesters);

  const gains = subjects
    .map(s => {
      if (s.points >= 4.45) return null; // already near A+
      const sim = semesters.map(sem => ({
        ...sem,
        subjects: sem.subjects.map(sub =>
          sub.id === s.id ? { ...sub, points: 4.5 } : sub
        )
      }));
      return { s, gain: calcCumulativeGpa(sim).gpa - cur };
    })
    .filter(x => x && x.gain > 0.001)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3);

  if (gains.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <p class="retake-recs-title">
      <i class="ph-bold ph-lightbulb"></i> A+ 재수강 시 효과 큰 과목
    </p>
    <div class="retake-recs-list">
      ${gains.map(({ s, gain }, i) => `
        <div class="retake-rec-item">
          <span class="retake-rec-rank">${i + 1}</span>
          <div class="retake-rec-info">
            <span class="retake-rec-name">${escHtml(s.name)}</span>
            <span class="retake-rec-sem">${escHtml(s.semName)}</span>
          </div>
          <span class="retake-rec-gain">+${gain.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
