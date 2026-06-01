/* ============================================================
   GradeR - Scholarship Tracker Module
   Tracks GPA thresholds for scholarship eligibility.
   ============================================================ */

import { getSettings, patchSettings, generateId, getSemesters } from './storage.js';
import { calcCumulativeGpa } from './calculator.js';
import { showToast, openModal, closeModal } from './ui.js';

const WARNING_MARGIN = 0.15; // within this distance = warning zone

export function initScholarship() {
  renderScholarshipList();

  document.getElementById('add-scholarship-btn')?.addEventListener('click', () => {
    document.getElementById('scholarship-name-input').value = '';
    document.getElementById('scholarship-gpa-input').value = '';
    document.getElementById('scholarship-scale-select').value = '4.5';
    openModal('scholarship-modal');
    setTimeout(() => document.getElementById('scholarship-name-input')?.focus(), 50);
  });

  bindScholarshipModal();

  window.addEventListener('gradedr:data-changed', renderScholarshipList);
  window.addEventListener('gradedr:section-change', e => {
    if (e.detail?.sectionId === 'section-target') renderScholarshipList();
  });
}

// ── Status Logic ──────────────────────────────────────────────

function getStatus(currentGpa, minGpa) {
  if (currentGpa >= minGpa) {
    return (currentGpa - minGpa < WARNING_MARGIN) ? 'warning' : 'success';
  }
  return 'danger';
}

const STATUS_CONFIG = {
  success: { icon: 'ph-check-circle', cls: 'sch-success', label: '유지 중' },
  warning: { icon: 'ph-warning',      cls: 'sch-warning', label: '위험'   },
  danger:  { icon: 'ph-x-circle',     cls: 'sch-danger',  label: '미달'   },
  unknown: { icon: 'ph-minus-circle', cls: 'sch-neutral', label: '—'      }
};

// ── Rendering ─────────────────────────────────────────────────

function renderScholarshipList() {
  const container = document.getElementById('scholarship-list');
  if (!container) return;

  const scholarships = getSettings().scholarships || [];
  const semesters    = getSemesters();
  const { gpa: currentGpa, totalCredits } = calcCumulativeGpa(semesters);

  container.innerHTML = '';

  if (scholarships.length === 0) {
    container.innerHTML = `
      <p class="sch-empty">아직 등록된 장학금 기준이 없어요.<br>추가 버튼으로 기준을 설정해보세요.</p>
    `;
    return;
  }

  scholarships.forEach(sch => {
    const status = totalCredits > 0 ? getStatus(currentGpa, sch.minGpa) : 'unknown';
    const s = STATUS_CONFIG[status];
    const maxGpa = sch.scale === '4.3' ? 4.3 : 4.5;
    const needed = totalCredits > 0 ? Math.max(0, sch.minGpa - currentGpa) : null;

    const item = document.createElement('div');
    item.className = `scholarship-item sch-item-${status}`;
    item.innerHTML = `
      <div class="sch-status-icon ${s.cls}">
        <i class="ph-bold ${s.icon}"></i>
      </div>
      <div class="sch-info">
        <span class="sch-name">${escHtml(sch.name)}</span>
        <span class="sch-req">기준 <strong>${sch.minGpa.toFixed(2)}</strong> / ${sch.scale} 만점제</span>
        ${status === 'danger' && needed !== null
          ? `<span class="sch-gap">현재보다 <strong>+${needed.toFixed(2)}</strong> 필요</span>`
          : status === 'warning'
            ? `<span class="sch-gap sch-gap-warn">기준까지 <strong>${(currentGpa - sch.minGpa).toFixed(2)}</strong> 여유</span>`
            : ''}
      </div>
      <span class="sch-badge ${s.cls}">${s.label}</span>
      <button class="subject-action-btn delete" aria-label="${escHtml(sch.name)} 삭제" data-id="${sch.id}">
        <i class="ph-bold ph-trash"></i>
      </button>
    `;

    item.querySelector('.delete').addEventListener('click', () => deleteScholarship(sch.id, sch.name));
    container.appendChild(item);
  });
}

// ── CRUD ──────────────────────────────────────────────────────

function addScholarship(name, minGpaStr, scale) {
  const trimmed = name.trim();
  if (!trimmed) { showToast('장학금 이름을 입력해주세요', 'warning'); return false; }

  const minGpa = parseFloat(minGpaStr);
  const maxGpa = scale === '4.3' ? 4.3 : 4.5;
  if (isNaN(minGpa) || minGpa <= 0 || minGpa > maxGpa) {
    showToast(`GPA 기준은 0보다 크고 ${maxGpa} 이하여야 해요`, 'warning');
    return false;
  }

  const settings = getSettings();
  const scholarships = [...(settings.scholarships || [])];
  scholarships.push({ id: generateId('sch'), name: trimmed, minGpa, scale });
  patchSettings({ scholarships });
  renderScholarshipList();
  showToast(`${trimmed} 장학금 기준이 추가됐어요`, 'success', 2500);
  return true;
}

function deleteScholarship(id, name) {
  const settings = getSettings();
  patchSettings({ scholarships: (settings.scholarships || []).filter(s => s.id !== id) });
  renderScholarshipList();
  showToast(`${name} 삭제됐어요`, 'info', 2000);
}

// ── Modal Binding ─────────────────────────────────────────────

function bindScholarshipModal() {
  const nameInput   = document.getElementById('scholarship-name-input');
  const gpaInput    = document.getElementById('scholarship-gpa-input');
  const scaleSelect = document.getElementById('scholarship-scale-select');
  const overlay     = document.getElementById('scholarship-modal');

  document.getElementById('scholarship-modal-cancel')?.addEventListener('click', () => closeModal('scholarship-modal'));
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal('scholarship-modal'); });

  document.getElementById('scholarship-modal-confirm')?.addEventListener('click', () => {
    const ok = addScholarship(nameInput?.value || '', gpaInput?.value || '', scaleSelect?.value || '4.5');
    if (ok) closeModal('scholarship-modal');
  });

  nameInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); gpaInput?.focus(); }
  });

  gpaInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const ok = addScholarship(nameInput?.value || '', gpaInput?.value || '', scaleSelect?.value || '4.5');
      if (ok) closeModal('scholarship-modal');
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
