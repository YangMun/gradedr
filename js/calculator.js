/* ============================================================
   GradeR - Calculator Module
   Feature 1: weighted GPA arithmetic + subject list rendering.
   ============================================================ */

import {
  getSubjects, saveSubjects, getSemesterScale, setSemesterScale,
  getSemesters, generateId
} from './storage.js';
import {
  buildSelectOptions, getPoints, hundredToGrade, getGradeTier, getMaxPoints
} from './gradeScale.js';
import { showToast, openModal, closeModal } from './ui.js';

// Current active semester ID (set by semesters.js)
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

// ── Grade Select Sync ─────────────────────────────────────────

export function populateGradeSelects(scale) {
  const options = buildSelectOptions(scale);
  const isScore = scale === '100';

  // Main form
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

  // Edit modal
  const editGrade = document.getElementById('edit-grade');
  if (editGrade) {
    const editScale = isScore ? '4.5' : scale; // fallback to 4.5 for edit
    const editOpts  = buildSelectOptions(editScale);
    editGrade.innerHTML = editOpts
      .map(o => `<option value="${o.value}">${o.label}</option>`)
      .join('');
  }
}

// ── Subject Rendering ─────────────────────────────────────────

export function renderSubjectList(semId) {
  const subjects = getSubjects(semId);
  const list      = document.getElementById('subject-list');
  const empty     = document.getElementById('subject-empty');
  const badge     = document.getElementById('total-credits-badge');

  if (!list) return;

  // Remove existing subject items (keep empty-state)
  list.querySelectorAll('.subject-item').forEach(el => el.remove());

  if (subjects.length === 0) {
    empty && (empty.style.display = '');
    badge && (badge.textContent = '총 0학점');
    return;
  }

  empty && (empty.style.display = 'none');

  const { totalCredits } = calcGpa(subjects);
  badge && (badge.textContent = `총 ${totalCredits}학점`);

  for (const subj of subjects) {
    const tier = getGradeTier(subj.grade);
    const item = document.createElement('div');
    item.className = 'subject-item';
    item.setAttribute('role', 'listitem');
    item.dataset.id = subj.id;
    item.innerHTML = `
      <div class="subject-info">
        <div class="subject-name">${escHtml(subj.name)}</div>
        <div class="subject-meta">${subj.credits}학점 · ${subj.points.toFixed(1)}점</div>
      </div>
      <span class="subject-grade-badge grade-${tier}">${escHtml(subj.grade)}</span>
      <div class="subject-actions">
        <button class="subject-action-btn edit"   aria-label="${escHtml(subj.name)} 수정">
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
  const { gpa: cumGpa, totalCredits: cumCredits } = calcCumulativeGpa(allSemesters);

  const semGpaEl  = document.getElementById('semester-gpa');
  const cumGpaEl  = document.getElementById('cumulative-gpa');
  const credEl    = document.getElementById('earned-credits');
  const inlineEl  = document.getElementById('current-gpa-inline');

  semGpaEl  && (semGpaEl.textContent  = gpa.toFixed(2));
  cumGpaEl  && (cumGpaEl.textContent  = cumGpa.toFixed(2));
  credEl    && (credEl.textContent    = cumCredits);
  inlineEl  && (inlineEl.textContent  = cumGpa.toFixed(2));
}

// ── Subject CRUD ──────────────────────────────────────────────

export function addSubject(semId, { name, credits, grade, points }) {
  const subjects = getSubjects(semId);
  subjects.push({ id: generateId('subj'), name, credits: Number(credits), grade, points: Number(points) });
  saveSubjects(semId, subjects);
}

export function deleteSubject(semId, subjectId) {
  const subjects = getSubjects(semId).filter(s => s.id !== subjectId);
  saveSubjects(semId, subjects);
  renderSubjectList(semId);
  updateGpaDisplay(semId);
  showToast('과목이 삭제됐어요', 'info', 2000);
}

export function updateSubject(semId, subjectId, { name, credits, grade }) {
  const scale    = getSemesterScale(semId);
  const useScale = scale === '100' ? '4.5' : scale;
  const points   = getPoints(useScale, grade);
  const subjects = getSubjects(semId).map(s =>
    s.id === subjectId
      ? { ...s, name, credits: Number(credits), grade, points }
      : s
  );
  saveSubjects(semId, subjects);
  renderSubjectList(semId);
  updateGpaDisplay(semId);
  showToast('과목이 수정됐어요', 'success', 2000);
}

// ── Edit Modal ────────────────────────────────────────────────

function openEditModal(semId, subjectId) {
  const subj  = getSubjects(semId).find(s => s.id === subjectId);
  if (!subj) return;

  const scale    = getSemesterScale(semId);
  const useScale = scale === '100' ? '4.5' : scale;

  // Populate edit grade select for current scale
  const editGrade = document.getElementById('edit-grade');
  if (editGrade) {
    editGrade.innerHTML = buildSelectOptions(useScale)
      .map(o => `<option value="${o.value}">${o.label}</option>`)
      .join('');
    editGrade.value = subj.grade;
  }

  document.getElementById('edit-subject-id').value   = subjectId;
  document.getElementById('edit-name').value         = subj.name;
  document.getElementById('edit-credits').value      = subj.credits;

  openModal('edit-modal');
}

function bindEditModal(semId) {
  document.getElementById('edit-modal-cancel')?.addEventListener('click', () => closeModal('edit-modal'));
  document.getElementById('edit-modal-confirm')?.addEventListener('click', () => {
    const id      = document.getElementById('edit-subject-id').value;
    const name    = document.getElementById('edit-name').value.trim();
    const credits = document.getElementById('edit-credits').value;
    const grade   = document.getElementById('edit-grade').value;
    if (!name) { showToast('과목명을 입력해주세요', 'warning'); return; }
    updateSubject(semId, id, { name, credits, grade });
    closeModal('edit-modal');
  });

  // Close on overlay click
  document.getElementById('edit-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('edit-modal');
  });
}

// ── Subject Form ──────────────────────────────────────────────

export function attachSubjectFormHandler(semId) {
  const form = document.getElementById('subject-form');
  if (!form) return;

  // Remove old listener by cloning
  const newForm = form.cloneNode(true);
  form.replaceWith(newForm);

  // Re-populate grade selects for current scale
  const scale = getSemesterScale(semId);
  populateGradeSelects(scale);
  syncScaleRadios(scale);

  // Scale radio change
  document.querySelectorAll('input[name="grade-scale"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const newScale = radio.value;
      setSemesterScale(semId, newScale);
      populateGradeSelects(newScale);
    });
  });

  // Form submit
  document.getElementById('subject-form').addEventListener('submit', e => {
    e.preventDefault();
    const currentScale = getSemesterScale(semId);
    const name    = document.getElementById('subject-name').value.trim();
    const credits = document.getElementById('subject-credits').value;

    if (!name) { showToast('과목명을 입력해주세요', 'warning'); return; }

    let grade, points;

    if (currentScale === '100') {
      const scoreInput = document.getElementById('subject-score');
      const score = Number(scoreInput?.value);
      if (isNaN(score) || score < 0 || score > 100) {
        showToast('0~100 사이의 점수를 입력해주세요', 'warning');
        return;
      }
      // Convert using 4.5 scale thresholds
      const converted = hundredToGrade(score, '4.5');
      grade  = `${score}점 → ${converted.grade}`;
      points = converted.points;
      if (scoreInput) scoreInput.value = '';
    } else {
      grade  = document.getElementById('subject-grade').value;
      points = getPoints(currentScale, grade);
    }

    addSubject(semId, { name, credits, grade, points });
    renderSubjectList(semId);
    updateGpaDisplay(semId);

    document.getElementById('subject-name').value = '';
    document.getElementById('subject-name').focus();
    showToast(`${name} 추가됐어요`, 'success', 2000);
  });

  bindEditModal(semId);
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
