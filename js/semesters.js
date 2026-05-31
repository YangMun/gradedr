/* ============================================================
   GradeR - Semesters Module
   Feature 3 (basic): semester tab CRUD + activation.
   ============================================================ */

import {
  getSemesters, saveSemesters, getSettings, patchSettings, generateId
} from './storage.js';
import {
  setActiveSemId, attachSubjectFormHandler, renderSubjectList, updateGpaDisplay
} from './calculator.js';
import { showToast, openModal, closeModal } from './ui.js';

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

  // "+" button → open add semester modal
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
    tab.innerHTML = `
      <span class="tab-label">${escHtml(sem.label)}</span>
      <button class="tab-delete" aria-label="${escHtml(sem.label)} 삭제" tabindex="-1">
        <i class="ph-bold ph-x"></i>
      </button>
    `;

    tab.addEventListener('click', e => {
      // Ignore clicks on delete button
      if (e.target.closest('.tab-delete')) return;
      activateSemester(sem.id);
    });

    tab.querySelector('.tab-delete').addEventListener('click', e => {
      e.stopPropagation();
      deleteSemester(sem.id);
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

// ── Delete Semester ───────────────────────────────────────────

export function deleteSemester(semId) {
  const semesters = getSemesters();
  if (semesters.length <= 1) {
    showToast('마지막 학기는 삭제할 수 없어요', 'warning');
    return;
  }

  const sem = semesters.find(s => s.id === semId);
  if (!confirm(`'${sem?.label}' 학기를 삭제할까요?\n(과목 데이터도 모두 삭제됩니다)`)) return;

  const remaining = semesters.filter(s => s.id !== semId);
  saveSemesters(remaining);

  const idx     = semesters.findIndex(s => s.id === semId);
  const nextId  = remaining[Math.min(idx, remaining.length - 1)]?.id;
  renderTabs(remaining, nextId);
  if (nextId) activateSemester(nextId);
  showToast(`학기가 삭제됐어요`, 'info', 2000);
}

// ── Semester Modal Binding ────────────────────────────────────

function bindSemesterModal() {
  const input   = document.getElementById('semester-label-input');
  const cancel  = document.getElementById('semester-modal-cancel');
  const confirm = document.getElementById('semester-modal-confirm');
  const overlay = document.getElementById('semester-modal');

  cancel?.addEventListener('click',  () => closeModal('semester-modal'));
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal('semester-modal'); });

  confirm?.addEventListener('click', () => {
    addSemester(input?.value || '');
    closeModal('semester-modal');
  });

  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSemester(input.value);
      closeModal('semester-modal');
    }
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
