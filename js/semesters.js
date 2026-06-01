/* ============================================================
   GradeR - Semesters Module
   Feature 3 (basic): semester tab CRUD + activation.
   ============================================================ */

import {
  getSemesters, saveSemesters, getSettings, patchSettings, generateId, saveSubjects
} from './storage.js';
import {
  setActiveSemId, attachSubjectFormHandler, renderSubjectList, updateGpaDisplay
} from './calculator.js';
import { showToast, openModal, closeModal, showConfirmModal } from './ui.js';

let _copySourceId = null;

// ── Init ──────────────────────────────────────────────────────

export function initSemesters() {
  const semesters  = getSemesters();
  const { activeSemesterId } = getSettings();
  const firstId    = semesters.length ? semesters[0].id : null;
  const targetId   = semesters.find(s => s.id === activeSemesterId)
    ? activeSemesterId
    : firstId;

  renderTabs(semesters, targetId);
  if (targetId) activateSemester(targetId);

  document.getElementById('add-semester-btn')?.addEventListener('click', () => {
    document.getElementById('semester-label-input').value = '';
    openModal('semester-modal');
    setTimeout(() => document.getElementById('semester-label-input')?.focus(), 50);
  });

  bindSemesterModal();
}

// ── Tab Rendering ─────────────────────────────────────────────

export function renderTabs(semesters, activeId) {
  const bar = document.getElementById('tab-bar');
  if (!bar) return;
  bar.innerHTML = '';

  semesters.forEach(sem => {
    const tab = document.createElement('button');
    tab.className = `tab-item${sem.id === activeId ? ' active' : ''}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', sem.id === activeId ? 'true' : 'false');
    tab.dataset.semId = sem.id;
    // Use <span role="button"> instead of nested <button> to avoid invalid HTML nesting
    tab.innerHTML = `
      <span class="tab-label">${escHtml(sem.label)}</span>
      <span class="tab-copy" role="button" tabindex="-1" aria-label="${escHtml(sem.label)} 복사">
        <i class="ph-bold ph-copy"></i>
      </span>
      <span class="tab-delete" role="button" tabindex="-1" aria-label="${escHtml(sem.label)} 삭제">
        <i class="ph-bold ph-x"></i>
      </span>
    `;

    tab.addEventListener('click', e => {
      if (e.target.closest('.tab-delete') || e.target.closest('.tab-copy')) return;
      activateSemester(sem.id);
    });

    const copySpan = tab.querySelector('.tab-copy');
    copySpan.addEventListener('click', e => {
      e.stopPropagation();
      _copySourceId = sem.id;
      const input = document.getElementById('semester-label-input');
      if (input) input.value = `${sem.label} (복사)`;
      openModal('semester-modal');
      setTimeout(() => input?.focus(), 50);
    });
    copySpan.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        copySpan.click();
      }
    });

    const deleteSpan = tab.querySelector('.tab-delete');
    deleteSpan.addEventListener('click', e => {
      e.stopPropagation();
      deleteSemester(sem.id);
    });
    deleteSpan.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        deleteSemester(sem.id);
      }
    });

    bar.appendChild(tab);
  });
}

// ── Activate ──────────────────────────────────────────────────

export function activateSemester(semId) {
  const semesters = getSemesters();
  renderTabs(semesters, semId);
  setActiveSemId(semId);
  patchSettings({ activeSemesterId: semId });
  attachSubjectFormHandler(semId);
  renderSubjectList(semId);
  updateGpaDisplay(semId);
}

// ── Add Semester ──────────────────────────────────────────────

function addSemester(label) {
  const trimmed = label.trim();
  if (!trimmed) { showToast('학기 이름을 입력해주세요', 'warning'); return; }

  const semesters = getSemesters();
  if (semesters.find(s => s.label === trimmed)) {
    showToast('이미 같은 이름의 학기가 있어요', 'warning');
    return;
  }

  const newSem = { id: generateId('sem'), label: trimmed, gradeScale: '4.5', subjects: [] };
  semesters.push(newSem);
  saveSemesters(semesters);
  renderTabs(semesters, newSem.id);
  activateSemester(newSem.id);
  showToast(`${trimmed} 학기가 추가됐어요`, 'success', 2000);
}

// ── Copy Semester ─────────────────────────────────────────────

function copySemester(sourceId, newLabel) {
  const trimmed = newLabel.trim();
  if (!trimmed) { showToast('학기 이름을 입력해주세요', 'warning'); return false; }

  const semesters = getSemesters();
  if (semesters.find(s => s.label === trimmed)) {
    showToast('이미 같은 이름의 학기가 있어요', 'warning');
    return false;
  }

  const source = semesters.find(s => s.id === sourceId);
  if (!source) return false;

  const newSem = {
    id:         generateId('sem'),
    label:      trimmed,
    gradeScale: source.gradeScale,
    subjects:   source.subjects.map(s => ({ ...s, id: generateId('subj') }))
  };
  semesters.push(newSem);
  saveSemesters(semesters);
  renderTabs(semesters, newSem.id);
  activateSemester(newSem.id);
  showToast(`${trimmed} 학기가 복사됐어요`, 'success', 2000);
  return true;
}

// ── Delete Semester ───────────────────────────────────────────

export function deleteSemester(semId) {
  const semesters = getSemesters();
  if (semesters.length <= 1) {
    showToast('마지막 학기는 삭제할 수 없어요', 'warning');
    return;
  }

  const sem = semesters.find(s => s.id === semId);

  showConfirmModal({
    title: '학기 삭제',
    desc:  `'${sem?.label}' 학기를 삭제하면 모든 과목 데이터도 함께 삭제돼요.`,
    onConfirm: () => {
      const remaining = getSemesters().filter(s => s.id !== semId);
      saveSemesters(remaining);

      const idx    = semesters.findIndex(s => s.id === semId);
      const nextId = remaining[Math.min(idx, remaining.length - 1)]?.id;
      renderTabs(remaining, nextId);
      if (nextId) activateSemester(nextId);
      showToast('학기가 삭제됐어요', 'info', 2000);
    }
  });
}

// ── Semester Modal Binding ────────────────────────────────────

function bindSemesterModal() {
  const input   = document.getElementById('semester-label-input');
  const cancel  = document.getElementById('semester-modal-cancel');
  const confirm = document.getElementById('semester-modal-confirm');
  const overlay = document.getElementById('semester-modal');

  cancel?.addEventListener('click',  () => { _copySourceId = null; closeModal('semester-modal'); });
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) { _copySourceId = null; closeModal('semester-modal'); }
  });

  const doConfirm = () => {
    const ok = _copySourceId
      ? copySemester(_copySourceId, input?.value || '')
      : (addSemester(input?.value || ''), true);
    if (ok !== false) { _copySourceId = null; closeModal('semester-modal'); }
  };

  confirm?.addEventListener('click', doConfirm);

  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doConfirm(); }
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
