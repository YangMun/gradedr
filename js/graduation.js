/* ============================================================
   GradeR - Graduation Credits Module
   Manages goal setting and progress bar in GPA summary card.
   ============================================================ */

import { getSettings, patchSettings } from './storage.js';
import { showToast } from './ui.js';

export function initGraduation() {
  const { graduationCredits } = getSettings();

  const input = document.getElementById('grad-credits-input');
  const saveBtn = document.getElementById('grad-credits-save');

  if (input && graduationCredits > 0) {
    input.value = graduationCredits;
  }

  saveBtn?.addEventListener('click', () => {
    const val = parseInt(input?.value, 10);
    if (isNaN(val) || val < 1) {
      showToast('올바른 학점 수를 입력해주세요', 'warning');
      return;
    }
    patchSettings({ graduationCredits: val });
    // Trigger GPA display refresh to show updated bar
    window.dispatchEvent(new CustomEvent('gradedr:data-changed'));
    showToast(`졸업 목표 학점이 ${val}학점으로 저장됐어요`, 'success', 2500);
  });

  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn?.click();
    }
  });
}
