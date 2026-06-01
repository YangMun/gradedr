/* ============================================================
   GradeR - Calculator Module
   Feature 1: weighted GPA arithmetic + subject list rendering.
   ============================================================ */

import {
  getSubjects, saveSubjects, getSemesterScale, setSemesterScale,
  getSemesters, generateId, getSettings
} from './storage.js';
import {
  buildSelectOptions, getPoints, hundredToGrade, getGradeTier, getMaxPoints
} from './gradeScale.js';
import { showToast, showUndoToast, openModal, closeModal } from './ui.js';

let _activeSemId = null;

export function setActiveSemId(id) { _activeSemId = id; }
export function getActiveSemId()   { return _activeSemId; }

// ── Pure Calculation ──────────────────────────────────────────

export function calcGpa(subjects) {
  let totalPoints  = 0;
  let totalCredits = 0;
  for (const s of subjects) {
    totalPoints  += Number(s.credits) * Number(s.points);
    totalCredits += Number(s.credits);
  }
  return {
    gpa:          totalCredits > 0 ? totalPoints / totalCredits : 0,
    totalCredits
  };
}

export function calcCumulativeGpa(semesters) {
  const allSubjects = semesters.flatMap(s => s.subjects);
  return calcGpa(allSubjects);
}

export function calcGpaByType(semesters) {
  const all = semesters.flatMap(s => s.subjects);
  const majorSubjects   = all.filter(s => (s.type || 'major') === 'major');
  const generalSubjects = all.filter(s => (s.type || 'major') === 'general');
  return {
    major:   calcGpa(majorSubjects),
    general: calcGpa(generalSubjects)
  };
}

function dispatchDataChanged() {
  window.dispatchEvent(new CustomEvent('gradedr:data-changed'));
}

// ── Grade Select Sync ─────────────────────────────────────────

export function populateGradeSelects(scale) {
  const options = buildSelectOptions(scale);
  const isScore = scale === '100';

  const gradeWrapper = document.getElementById('grade-select-wrapper');
  const scoreWrapper = document.getElementById('score-input-wrapper');
  const gradeSelect  = document.getElementById('subject-grade');

  if (gradeWrapper) gradeWrapper.style.display = isScore ? 'none' : '';
  if (scoreWrapper) scoreWrapper.style.display = isScore ? ''     : 'none';

  if (gradeSelect && !isScore) {
    gradeSelect.innerHTML = options
      .map(o => `<option value="${o.value}">${o.label}</option>`)
      .join('');
  }

  // Edit modal grade select
  const editGrade = document.getElementById('edit-grade');
  if (editGrade) {
    const editScale = isScore ? '4.5' : scale;
    editGrade.innerHTML = buildSelectOptions(editScale)
      .map(o => `<option value="${o.value}">${o.label}</option>`)
      .join('');
  }
}

// ── Subject Rendering ─────────────────────────────────────────

const TYPE_LABEL = { major: '전공', general: '교양', other: '기타' };
const TYPE_CLASS = { major: 'type-major', general: 'type-general', other: 'type-other' };

export function renderSubjectList(semId) {
  const subjects = getSubjects(semId);
  const list      = document.getElementById('subject-list');
  const empty     = document.getElementById('subject-empty');
  const badge     = document.getElementById('total-credits-badge');

  if (!list) return;

  list.querySelectorAll('.subject-item').forEach(el => el.remove());

  if (subjects.length === 0) {
    empty && (empty.style.display = '');
    badge && (badge.textContent = '0학점');
    return;
  }

  empty && (empty.style.display = 'none');

  const { totalCredits } = calcGpa(subjects);
  badge && (badge.textContent = `${totalCredits}학점`);

  for (const subj of subjects) {
    const tier      = getGradeTier(subj.grade);
    const typeKey   = subj.type || 'major';
    const typeLabel = TYPE_LABEL[typeKey] || '전공';
    const typeCls   = TYPE_CLASS[typeKey] || 'type-major';
    const item = document.createElement('div');
    item.className = `subject-item grade-${tier}`;
    item.setAttribute('role', 'listitem');
    item.dataset.id = subj.id;
    item.innerHTML = `
      <div class="subject-accent-bar" aria-hidden="true"></div>
      <div class="subject-info">
        <div class="subject-name">
          ${escHtml(subj.name)}
          <span class="type-chip ${typeCls}">${typeLabel}</span>
        </div>
        <div class="subject-meta">${subj.credits}학점 · ${subj.points.toFixed(1)}점</div>
      </div>
      <span class="subject-grade-badge">${escHtml(subj.grade.replace(/^(\d+)점 → /, ''))}</span>
      <div class="subject-actions">
        <button class="subject-action-btn edit" aria-label="${escHtml(subj.name)} 수정">
          <i class="ph-bold ph-pencil-simple"></i>
        </button>
        <button class="subject-action-btn delete" aria-label="${escHtml(subj.name)} 삭제">
          <i class="ph-bold ph-trash"></i>
        </button>
      </div>
    `;

    item.querySelector('.edit').addEventListener('click', () => openEditModal(semId, subj.id));
    item.querySelector('.delete').addEventListener('click', () => deleteSubject(semId, subj.id));

    list.appendChild(item);
  }
}

// ── GPA Display Update ────────────────────────────────────────

export function updateGpaDisplay(semId) {
  const subjects      = getSubjects(semId);
  const { gpa, totalCredits } = calcGpa(subjects);
  const allSemesters  = getSemesters();
  const allSubjects   = allSemesters.flatMap(s => s.subjects);
  const { gpa: cumGpa, totalCredits: cumCredits } = calcCumulativeGpa(allSemesters);

  const semGpaEl  = document.getElementById('semester-gpa');
  const cumGpaEl  = document.getElementById('cumulative-gpa');
  const credEl    = document.getElementById('earned-credits');
  const inlineEl  = document.getElementById('current-gpa-inline');

  semGpaEl  && (semGpaEl.textContent  = subjects.length > 0   ? gpa.toFixed(2)    : '-');
  cumGpaEl  && (cumGpaEl.textContent  = allSubjects.length > 0 ? cumGpa.toFixed(2) : '-');
  credEl    && (credEl.textContent    = cumCredits);
  inlineEl  && (inlineEl.textContent  = allSubjects.length > 0 ? cumGpa.toFixed(2) : '-');

  renderTypeGpaRow(allSemesters);
  renderSemStats(semId, subjects);
  updateGraduationBar(cumCredits);
}

function renderTypeGpaRow(allSemesters) {
  const row = document.getElementById('type-gpa-row');
  if (!row) return;

  const { major, general } = calcGpaByType(allSemesters);
  const hasMajor   = major.totalCredits > 0;
  const hasGeneral = general.totalCredits > 0;

  if (!hasMajor && !hasGeneral) {
    row.style.display = 'none';
    return;
  }

  row.style.display = '';
  row.innerHTML = '';

  if (hasMajor) {
    const chip = document.createElement('span');
    chip.className = 'type-gpa-chip type-gpa-major';
    chip.innerHTML = `<span class="type-gpa-label">전공</span><span class="type-gpa-value">${major.gpa.toFixed(2)}</span>`;
    row.appendChild(chip);
  }
  if (hasMajor && hasGeneral) {
    const sep = document.createElement('span');
    sep.className = 'type-gpa-sep';
    sep.textContent = '·';
    row.appendChild(sep);
  }
  if (hasGeneral) {
    const chip = document.createElement('span');
    chip.className = 'type-gpa-chip type-gpa-general';
    chip.innerHTML = `<span class="type-gpa-label">교양</span><span class="type-gpa-value">${general.gpa.toFixed(2)}</span>`;
    row.appendChild(chip);
  }
}

function renderSemStats(semId, subjects) {
  const row = document.getElementById('sem-stats-row');
  if (!row) return;
  row.innerHTML = '';
  if (subjects.length === 0) return;

  const sorted = [...subjects].sort((a, b) => b.points - a.points);
  const best   = sorted[0];
  const worst  = sorted[sorted.length - 1];
  const avgCr  = (subjects.reduce((s, c) => s + c.credits, 0) / subjects.length).toFixed(1);

  const chips = [
    { icon: 'ph-arrow-up',   label: `최고 ${escHtml(best.grade.replace(/^(\d+)점 → /, ''))}` },
    { icon: 'ph-arrow-down', label: `최저 ${escHtml(worst.grade.replace(/^(\d+)점 → /, ''))}` },
    { icon: 'ph-book-open',  label: `평균 ${avgCr}학점` }
  ];

  chips.forEach(({ icon, label }) => {
    const chip = document.createElement('span');
    chip.className = 'sem-stat-chip';
    chip.innerHTML = `<i class="ph-bold ${icon}"></i><strong>${label}</strong>`;
    row.appendChild(chip);
  });
}

function updateGraduationBar(earnedCredits) {
  const wrap     = document.getElementById('graduation-progress-wrap');
  const textEl   = document.getElementById('grad-progress-text');
  const fillEl   = document.getElementById('grad-progress-fill');
  const goal     = Number(getSettings().graduationCredits || 0);

  if (!wrap) return;

  if (goal <= 0) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';
  if (textEl) textEl.textContent = `${earnedCredits} / ${goal}학점`;
  if (fillEl) {
    const pct = Math.min(100, Math.round((earnedCredits / goal) * 100));
    fillEl.style.width = `${pct}%`;
  }
}

// ── Subject CRUD ──────────────────────────────────────────────

export function addSubject(semId, { name, credits, grade, points, type }) {
  const subjects = getSubjects(semId);
  subjects.push({
    id: generateId('subj'),
    name,
    credits: Number(credits),
    grade,
    points: Number(points),
    type: type || 'major'
  });
  saveSubjects(semId, subjects);
  dispatchDataChanged();
}

export function deleteSubject(semId, subjectId) {
  const subjects = getSubjects(semId);
  const deleted  = subjects.find(s => s.id === subjectId);
  if (!deleted) return;

  saveSubjects(semId, subjects.filter(s => s.id !== subjectId));
  renderSubjectList(semId);
  updateGpaDisplay(semId);

  showUndoToast(`${deleted.name} 삭제됐어요`, () => {
    const current = getSubjects(semId);
    current.push(deleted);
    saveSubjects(semId, current);
    renderSubjectList(semId);
    updateGpaDisplay(semId);
    dispatchDataChanged();
    showToast('과목이 복구됐어요', 'success', 2000);
  });
}

export function updateSubject(semId, subjectId, { name, credits, grade, type }) {
  const scale    = getSemesterScale(semId);
  const useScale = scale === '100' ? '4.5' : scale;
  const points   = getPoints(useScale, grade);
  const subjects = getSubjects(semId).map(s =>
    s.id === subjectId
      ? { ...s, name, credits: Number(credits), grade, points, type: type || s.type || 'major' }
      : s
  );
  saveSubjects(semId, subjects);
  renderSubjectList(semId);
  updateGpaDisplay(semId);
  dispatchDataChanged();
  showToast('과목이 수정됐어요', 'success', 2000);
}

// ── Edit Modal ────────────────────────────────────────────────

function openEditModal(semId, subjectId) {
  const subj = getSubjects(semId).find(s => s.id === subjectId);
  if (!subj) return;

  const scale    = getSemesterScale(semId);
  const useScale = scale === '100' ? '4.5' : scale;

  const editGrade = document.getElementById('edit-grade');
  if (editGrade) {
    editGrade.innerHTML = buildSelectOptions(useScale)
      .map(o => `<option value="${o.value}">${o.label}</option>`)
      .join('');
    // Handle "85점 → B+" stored grade — extract letter grade for select
    const matchScore = subj.grade.match(/^(\d+)점 → (.+)$/);
    editGrade.value = matchScore ? matchScore[2] : subj.grade;
  }

  document.getElementById('edit-subject-id').value = subjectId;
  document.getElementById('edit-name').value        = subj.name;
  document.getElementById('edit-credits').value     = subj.credits;

  const editType = document.getElementById('edit-type');
  if (editType) editType.value = subj.type || 'major';

  openModal('edit-modal');
}

// ── Subject Form (bound once at init) ────────────────────────

export function initSubjectForm() {
  // Scale radio change — bound once, reads active sem at runtime
  document.querySelectorAll('input[name="grade-scale"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const semId = getActiveSemId();
      if (!semId) return;
      const newScale = radio.value;
      setSemesterScale(semId, newScale);
      populateGradeSelects(newScale);
    });
  });

  // Form submit — bound once
  document.getElementById('subject-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const semId = getActiveSemId();
    if (!semId) return;

    const currentScale = getSemesterScale(semId);
    const name    = document.getElementById('subject-name').value.trim();
    const credits = document.getElementById('subject-credits').value;
    const type    = document.getElementById('subject-type')?.value || 'major';

    if (!name) { showToast('과목명을 입력해주세요', 'warning'); return; }

    let grade, points;

    if (currentScale === '100') {
      const scoreInput = document.getElementById('subject-score');
      const score = Number(scoreInput?.value);
      if (isNaN(score) || score < 0 || score > 100) {
        showToast('0~100 사이의 점수를 입력해주세요', 'warning');
        return;
      }
      const converted = hundredToGrade(score, '4.5');
      grade  = `${score}점 → ${converted.grade}`;
      points = converted.points;
      if (scoreInput) scoreInput.value = '';
    } else {
      grade  = document.getElementById('subject-grade').value;
      points = getPoints(currentScale, grade);
    }

    addSubject(semId, { name, credits, grade, points, type });
    renderSubjectList(semId);
    updateGpaDisplay(semId);

    document.getElementById('subject-name').value = '';
    document.getElementById('subject-name').focus();
    showToast(`${name} 추가됐어요`, 'success', 2000);
  });

  // Edit modal: cancel + overlay — bound once (semId not needed)
  document.getElementById('edit-modal-cancel')?.addEventListener('click', () => closeModal('edit-modal'));
  document.getElementById('edit-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('edit-modal');
  });
}

// ── Per-semester UI sync ──────────────────────────────────────

export function attachSubjectFormHandler(semId) {
  const scale = getSemesterScale(semId);
  populateGradeSelects(scale);
  syncScaleRadios(scale);

  // Re-bind edit modal confirm with current semId
  const confirmBtn = document.getElementById('edit-modal-confirm');
  if (confirmBtn) {
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', () => {
      const id      = document.getElementById('edit-subject-id').value;
      const name    = document.getElementById('edit-name').value.trim();
      const credits = document.getElementById('edit-credits').value;
      const grade   = document.getElementById('edit-grade').value;
      const type    = document.getElementById('edit-type')?.value || 'major';
      if (!name) { showToast('과목명을 입력해주세요', 'warning'); return; }
      updateSubject(semId, id, { name, credits, grade, type });
      closeModal('edit-modal');
    });
  }
}

function syncScaleRadios(scale) {
  document.querySelectorAll('input[name="grade-scale"]').forEach(radio => {
    radio.checked = radio.value === scale;
  });
}

// ── Helpers ───────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
