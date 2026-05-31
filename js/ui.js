/* ============================================================
   GradeR - UI Module
   Theme toggle, section navigation, toast, modal helpers.
   ============================================================ */

import { getSettings, patchSettings } from './storage.js';

// === Theme ===

export function initTheme() {
  const { theme } = getSettings();
  applyTheme(theme);
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const iconLight = document.getElementById('theme-icon-light');
  const iconDark  = document.getElementById('theme-icon-dark');
  if (theme === 'dark') {
    iconLight && (iconLight.style.display = 'none');
    iconDark  && (iconDark.style.display  = '');
  } else {
    iconLight && (iconLight.style.display = '');
    iconDark  && (iconDark.style.display  = 'none');
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#6366f1');
  }
}

export function toggleTheme() {
  const current = getSettings().theme;
  const next = current === 'dark' ? 'light' : 'dark';
  patchSettings({ theme: next });
  applyTheme(next);
}

// === Navigation ===

export function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  const { activeSection } = getSettings();
  showSection(activeSection || 'section-calculator');
}

export function showSection(sectionId) {
  document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }

  patchSettings({ activeSection: sectionId });

  window.dispatchEvent(new CustomEvent('gradedr:section-change', { detail: { sectionId } }));
}

// === Toasts ===

let _toastId = 0;

const TOAST_ICONS = {
  info:    'ph-info',
  success: 'ph-check-circle',
  error:   'ph-x-circle',
  warning: 'ph-warning'
};

export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = ++_toastId;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = `toast-${id}`;
  toast.innerHTML = `<i class="ph-bold ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${message}</span>`;

  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));

  setTimeout(() => dismissToast(toast), duration);
}

export function showUndoToast(message, onUndo, duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = ++_toastId;
  const toast = document.createElement('div');
  toast.className = 'toast toast-info';
  toast.id = `toast-${id}`;
  toast.innerHTML = `
    <i class="ph-bold ph-trash"></i>
    <span>${message}</span>
    <button class="toast-action">취소</button>
  `;

  let undid = false;
  toast.querySelector('.toast-action').addEventListener('click', () => {
    undid = true;
    dismissToast(toast);
    onUndo();
  });

  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));

  const timer = setTimeout(() => {
    if (!undid) dismissToast(toast);
  }, duration);

  toast.querySelector('.toast-action').addEventListener('click', () => clearTimeout(timer));
}

function dismissToast(toast) {
  toast.classList.remove('toast-show');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

// === Modal helpers ===

export function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
}

export function showConfirmModal({ title, desc, onConfirm }) {
  const titleEl = document.getElementById('confirm-modal-title');
  const descEl  = document.getElementById('confirm-modal-desc');
  if (titleEl) titleEl.textContent = title;
  if (descEl)  descEl.textContent  = desc;

  // Replace buttons to remove stale listeners
  const oldOk     = document.getElementById('confirm-modal-ok');
  const oldCancel = document.getElementById('confirm-modal-cancel');

  const newOk = oldOk.cloneNode(true);
  const newCancel = oldCancel.cloneNode(true);
  oldOk.replaceWith(newOk);
  oldCancel.replaceWith(newCancel);

  newOk.addEventListener('click', () => {
    closeModal('confirm-modal');
    onConfirm();
  });
  newCancel.addEventListener('click', () => closeModal('confirm-modal'));

  const overlay = document.getElementById('confirm-modal');
  const overlayHandler = e => {
    if (e.target === overlay) closeModal('confirm-modal');
  };
  overlay.removeEventListener('click', overlayHandler);
  overlay.addEventListener('click', overlayHandler);

  openModal('confirm-modal');
}
