/* ============================================================
   GradeR - UI Module
   Theme toggle, section navigation, toast notifications.
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
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1d2e' : '#4361ee');
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

  // Notify other modules (e.g. charts lazy-init)
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

  // Trigger enter animation on next frame
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));

  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// === Modal helpers ===

export function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
