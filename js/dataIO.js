/* ============================================================
   GradeR - Data I/O Module
   Feature 6: JSON export/import, URL share, data reset.
   ============================================================ */

import { loadData, saveData } from './storage.js';
import { showToast } from './ui.js';

// ── Export ────────────────────────────────────────────────────

export function exportJson() {
  const data     = loadData();
  const json     = JSON.stringify(data, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const date     = new Date().toISOString().split('T')[0];
  const filename = `gradedr_${date}.json`;

  const a = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  showToast(`${filename} 저장됐어요`, 'success', 3000);
}

// ── Import ────────────────────────────────────────────────────

export function importJson(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      const { valid, error } = validateData(parsed);
      if (!valid) {
        showToast(`가져오기 실패: ${error}`, 'error', 4000);
        return;
      }
      saveData(parsed);
      showToast('데이터를 성공적으로 불러왔어요! 새로고침 할게요', 'success', 2500);
      setTimeout(() => location.reload(), 2600);
    } catch {
      showToast('올바른 JSON 파일이 아니에요', 'error', 3000);
    }
  };
  reader.readAsText(file);
}

// ── Validate ──────────────────────────────────────────────────

export function validateData(obj) {
  if (typeof obj !== 'object' || obj === null)
    return { valid: false, error: '데이터 형식이 올바르지 않아요' };

  if (typeof obj.version !== 'number')
    return { valid: false, error: 'version 필드가 없어요' };

  if (!Array.isArray(obj.semesters))
    return { valid: false, error: 'semesters 배열이 없어요' };

  for (const sem of obj.semesters) {
    if (!sem.id || !sem.label || !Array.isArray(sem.subjects))
      return { valid: false, error: '학기 데이터 구조가 잘못됐어요' };

    for (const subj of sem.subjects) {
      if (!subj.id || !subj.name || typeof subj.credits !== 'number' || typeof subj.points !== 'number')
        return { valid: false, error: '과목 데이터 구조가 잘못됐어요' };
    }
  }

  return { valid: true };
}

// ── URL Share ─────────────────────────────────────────────────

export function generateShareUrl() {
  const data    = loadData();
  const json    = JSON.stringify(data);
  const encoded = btoa(encodeURIComponent(json));

  if (encoded.length > 8000) {
    showToast('데이터가 너무 많아 URL 공유가 어려워요. JSON 파일로 내보내기를 이용해주세요', 'warning', 4000);
    return;
  }

  const url = `${location.origin}${location.pathname}?d=${encoded}`;

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => showToast('공유 링크가 클립보드에 복사됐어요!', 'success', 3000))
      .catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity  = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  showToast('공유 링크가 복사됐어요!', 'success', 3000);
}

// ── URL Import (runs at app startup) ─────────────────────────

export function importFromUrl() {
  const params  = new URLSearchParams(location.search);
  const encoded = params.get('d');
  if (!encoded) return;

  try {
    const json   = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    const { valid, error } = validateData(parsed);
    if (!valid) {
      console.warn('[GradeR] URL data invalid:', error);
      return;
    }
    saveData(parsed);
    // Remove the ?d= param from URL without reloading
    const clean = `${location.pathname}${location.hash}`;
    history.replaceState(null, '', clean);
    showToast('공유된 데이터를 불러왔어요!', 'success', 3000);
  } catch (e) {
    console.warn('[GradeR] Failed to parse URL data:', e);
  }
}

// ── Reset ─────────────────────────────────────────────────────

export function resetAllData() {
  if (!confirm('모든 학기 데이터를 초기화할까요?\n이 작업은 되돌릴 수 없어요.')) return;
  localStorage.removeItem('gradedr_data');
  showToast('데이터가 초기화됐어요. 새로고침 할게요', 'info', 2500);
  setTimeout(() => location.reload(), 2600);
}

// ── DOM Binding ───────────────────────────────────────────────

export function initDataSection() {
  // Export JSON
  document.getElementById('export-json-btn')?.addEventListener('click', exportJson);

  // Share URL
  document.getElementById('share-url-btn')?.addEventListener('click', generateShareUrl);

  // Import file input
  document.getElementById('import-file')?.addEventListener('change', e => {
    importJson(e.target.files?.[0]);
    e.target.value = ''; // allow re-selecting same file
  });

  // Import drop zone
  const zone = document.getElementById('import-zone');
  if (zone) {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      importJson(e.dataTransfer.files?.[0]);
    });
  }

  // Reset
  document.getElementById('reset-data-btn')?.addEventListener('click', resetAllData);
}
