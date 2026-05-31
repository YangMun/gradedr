/* ============================================================
   GradeR - Grade Simulator Module
   Feature 5: calculate required final exam score to achieve target grade.
   ============================================================ */

import { buildSelectOptions } from './gradeScale.js';

const GRADE_LOWER_BOUND_45 = {
  'A+': 95, 'A0': 90, 'B+': 85, 'B0': 80,
  'C+': 75, 'C0': 70, 'D+': 65, 'D0': 60, 'F': 0
};
const GRADE_LOWER_BOUND_43 = {
  'A': 95, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80,
  'C+': 77, 'C': 73, 'C-': 70, 'D+': 67, 'D': 63, 'D-': 60, 'F': 0
};

function getGradeLowerBound(scale, grade) {
  const map = scale === '4.3' ? GRADE_LOWER_BOUND_43 : GRADE_LOWER_BOUND_45;
  return map[grade] ?? 0;
}

// ── Pure Calculation ──────────────────────────────────────────

export function calcRequiredFinalScore({ midtermScore, midtermWeight, targetGrade, scale }) {
  const mid    = Number(midtermScore);
  const mw     = Number(midtermWeight);
  const fw     = 100 - mw;
  const target = getGradeLowerBound(scale, targetGrade);

  if (fw <= 0) return { required: null, status: 'invalid', message: '기말 비중이 0%예요. 중간 비중을 낮춰주세요.' };
  if (target === 0 && targetGrade === 'F') {
    return { required: 0, status: 'easy', message: '어떤 점수를 받아도 F가 나와요 (목표가 F인가요?)' };
  }

  const required = (target - mid * (mw / 100)) / (fw / 100);

  if (required <= 0) {
    return { required: 0, status: 'easy', message: `중간 성적만으로 이미 ${targetGrade} 달성이 가능해요! 🎉` };
  }
  if (required > 100) {
    return {
      required,
      status: 'impossible',
      message: `기말에 100점을 받아도 ${targetGrade}는 어려워요. 목표 등급을 낮춰보세요 😢`
    };
  }
  if (required >= 90) {
    return { required, status: 'hard', message: '기말에 매우 높은 점수가 필요해요 💪 집중 마무리!' };
  }
  return { required, status: 'achievable', message: '충분히 달성 가능한 점수예요. 화이팅 🔥' };
}

// ── DOM Binding ───────────────────────────────────────────────

export function renderSimulatorSection() {
  const simScale = document.getElementById('sim-scale');

  populateSimGradeSelect(simScale?.value || '4.5');

  simScale?.addEventListener('change', () => {
    populateSimGradeSelect(simScale.value);
    updateSimResult();
  });

  ['sim-midterm', 'sim-midterm-weight'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateSimResult);
  });

  // Use 'change' for select (programmatic value sets don't fire 'input')
  document.getElementById('sim-target-grade')?.addEventListener('change', updateSimResult);
}

function populateSimGradeSelect(scale) {
  const sel = document.getElementById('sim-target-grade');
  if (!sel) return;
  const opts = buildSelectOptions(scale);
  sel.innerHTML = opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  const defaultGrade = 'B+';
  if ([...sel.options].some(o => o.value === defaultGrade)) sel.value = defaultGrade;
}

function updateSimResult() {
  const midtermScore  = parseFloat(document.getElementById('sim-midterm')?.value);
  const midtermWeight = parseFloat(document.getElementById('sim-midterm-weight')?.value);
  const targetGrade   = document.getElementById('sim-target-grade')?.value;
  const scale         = document.getElementById('sim-scale')?.value || '4.5';

  const resultEl  = document.getElementById('sim-result');
  const valueEl   = document.getElementById('sim-result-value');
  const messageEl = document.getElementById('sim-result-message');

  if ([midtermScore, midtermWeight].some(isNaN) || !targetGrade) {
    if (resultEl) resultEl.style.display = 'none';
    return;
  }

  const { required, status, message } = calcRequiredFinalScore({
    midtermScore, midtermWeight, targetGrade, scale
  });

  if (!resultEl || !valueEl || !messageEl) return;

  resultEl.style.display = '';
  valueEl.className = 'result-value num';

  if (status === 'impossible') valueEl.classList.add('result-impossible');
  else if (status === 'easy')  valueEl.classList.add('result-easy');

  if (required === null) {
    valueEl.textContent = '-';
  } else if (status === 'easy') {
    valueEl.textContent = '이미 달성!';
  } else {
    valueEl.textContent = `${Math.ceil(required * 10) / 10}점`;
  }

  messageEl.textContent = message;
}
