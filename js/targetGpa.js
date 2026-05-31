/* ============================================================
   GradeR - Target GPA Module
   Feature 2: reverse-calculate required GPA for remaining credits.
   ============================================================ */

import { getMaxPoints } from './gradeScale.js';
import { getSemesters } from './storage.js';
import { calcCumulativeGpa } from './calculator.js';

// ── Pure Calculation ──────────────────────────────────────────

export function calcRequiredGpa({ currentGpa, earnedCredits, targetGpa, remainingCredits, scale }) {
  const maxPoints = getMaxPoints(scale);
  const e  = Number(earnedCredits);
  const r  = Number(remainingCredits);
  const cg = Number(currentGpa);
  const tg = Number(targetGpa);

  if (r <= 0) return { required: null, status: 'invalid', message: '남은 학점이 0 이하예요' };
  if (tg > maxPoints) return { required: null, status: 'invalid', message: `목표 평점이 최대(${maxPoints})를 초과해요` };

  const required = (tg * (e + r) - cg * e) / r;

  if (required < 0) {
    return { required: 0, status: 'easy', message: '이미 목표를 달성했어요! 남은 학기는 어떻게 받아도 돼요 🎉' };
  }
  if (required > maxPoints) {
    return { required, status: 'impossible', message: `필요 평점이 최대(${maxPoints})를 초과해요. 목표를 낮춰보세요 😢` };
  }
  if (required >= maxPoints - 0.1) {
    return { required, status: 'hard', message: '거의 모든 과목에서 최고 성적을 받아야 해요 💪' };
  }
  return { required, status: 'achievable', message: '달성 가능한 목표예요! 화이팅 🔥' };
}

// ── DOM Binding ───────────────────────────────────────────────

export function renderTargetSection() {
  const ids = ['t-current-gpa', 't-earned-credits', 't-target-gpa', 't-remaining-credits', 't-scale'];
  ids.forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateTargetResult);
    document.getElementById(id)?.addEventListener('change', updateTargetResult);
  });

  prefillFromCurrentData();

  // Reactive prefill: re-fill when navigating to this section
  window.addEventListener('gradedr:section-change', e => {
    if (e.detail?.sectionId === 'section-target') {
      prefillFromCurrentData();
      updateTargetResult();
    }
  });

  // Reactive prefill: re-fill when subject data changes
  window.addEventListener('gradedr:data-changed', () => {
    prefillFromCurrentData();
    updateTargetResult();
  });
}

function prefillFromCurrentData() {
  const semesters = getSemesters();
  const { gpa, totalCredits } = calcCumulativeGpa(semesters);
  if (totalCredits > 0) {
    const gpaEl  = document.getElementById('t-current-gpa');
    const credEl = document.getElementById('t-earned-credits');
    // Always update (not just when empty) so it stays in sync
    if (gpaEl)  gpaEl.value  = gpa.toFixed(2);
    if (credEl) credEl.value = totalCredits;
  }
}

function updateTargetResult() {
  const currentGpa       = parseFloat(document.getElementById('t-current-gpa')?.value);
  const earnedCredits    = parseFloat(document.getElementById('t-earned-credits')?.value);
  const targetGpa        = parseFloat(document.getElementById('t-target-gpa')?.value);
  const remainingCredits = parseFloat(document.getElementById('t-remaining-credits')?.value);
  const scale            = document.getElementById('t-scale')?.value || '4.5';

  const resultEl   = document.getElementById('target-result');
  const valueEl    = document.getElementById('target-result-value');
  const messageEl  = document.getElementById('target-result-message');

  if ([currentGpa, earnedCredits, targetGpa, remainingCredits].some(isNaN)) {
    if (resultEl) resultEl.style.display = 'none';
    return;
  }

  const { required, status, message } = calcRequiredGpa({
    currentGpa, earnedCredits, targetGpa, remainingCredits, scale
  });

  if (!resultEl || !valueEl || !messageEl) return;

  resultEl.style.display = '';

  valueEl.className = 'result-value num';
  if (status === 'impossible') valueEl.classList.add('result-impossible');
  else if (status === 'easy')  valueEl.classList.add('result-easy');

  if (required === null) {
    valueEl.textContent = '-';
  } else if (status === 'easy') {
    valueEl.textContent = '달성 완료!';
  } else {
    valueEl.textContent = required.toFixed(2);
  }

  messageEl.textContent = message;
}
