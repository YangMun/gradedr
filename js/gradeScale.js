/* ============================================================
   GradeR - Grade Scale Module
   Pure data + pure functions. Zero DOM, zero side effects.
   ============================================================ */

export const SCALES = {
  '4.5': {
    grades: ['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F'],
    points: [4.5,  4.0,  3.5,  3.0,  2.5,  2.0,  1.5,  1.0,  0.0]
  },
  '4.3': {
    grades: ['A',  'A-', 'B+', 'B',  'B-', 'C+', 'C',  'C-', 'D+', 'D',  'D-', 'F'],
    points: [4.3,  4.0,  3.7,  3.3,  3.0,  2.7,  2.3,  2.0,  1.7,  1.3,  1.0,  0.0]
  }
};

// Thresholds for 100-point → grade conversion (upper bound exclusive)
const HUNDRED_THRESHOLDS_45 = [
  { min: 95, grade: 'A+', points: 4.5 },
  { min: 90, grade: 'A0', points: 4.0 },
  { min: 85, grade: 'B+', points: 3.5 },
  { min: 80, grade: 'B0', points: 3.0 },
  { min: 75, grade: 'C+', points: 2.5 },
  { min: 70, grade: 'C0', points: 2.0 },
  { min: 65, grade: 'D+', points: 1.5 },
  { min: 60, grade: 'D0', points: 1.0 },
  { min:  0, grade: 'F',  points: 0.0 }
];

const HUNDRED_THRESHOLDS_43 = [
  { min: 95, grade: 'A',  points: 4.3 },
  { min: 90, grade: 'A-', points: 4.0 },
  { min: 87, grade: 'B+', points: 3.7 },
  { min: 83, grade: 'B',  points: 3.3 },
  { min: 80, grade: 'B-', points: 3.0 },
  { min: 77, grade: 'C+', points: 2.7 },
  { min: 73, grade: 'C',  points: 2.3 },
  { min: 70, grade: 'C-', points: 2.0 },
  { min: 67, grade: 'D+', points: 1.7 },
  { min: 63, grade: 'D',  points: 1.3 },
  { min: 60, grade: 'D-', points: 1.0 },
  { min:  0, grade: 'F',  points: 0.0 }
];

export function getPoints(scale, grade) {
  const s = SCALES[scale];
  if (!s) return 0;
  const idx = s.grades.indexOf(grade);
  return idx >= 0 ? s.points[idx] : 0;
}

export function hundredToGrade(score, scale = '4.5') {
  const thresholds = scale === '4.3' ? HUNDRED_THRESHOLDS_43 : HUNDRED_THRESHOLDS_45;
  const clamped = Math.max(0, Math.min(100, Number(score)));
  for (const t of thresholds) {
    if (clamped >= t.min) return { grade: t.grade, points: t.points };
  }
  return { grade: 'F', points: 0 };
}

export function buildSelectOptions(scale) {
  if (scale === '100') {
    // 100-point mode: user enters a raw score, conversion handled elsewhere
    return [{ label: '점수 직접 입력', value: '__score__' }];
  }
  const s = SCALES[scale];
  if (!s) return [];
  return s.grades.map((g, i) => ({ label: `${g} (${s.points[i].toFixed(1)})`, value: g }));
}

export function getMaxPoints(scale) {
  const s = SCALES[scale];
  return s ? s.points[0] : 4.5;
}

export function getGradeTier(grade) {
  if (!grade) return 'F';
  const g = grade.toUpperCase();
  if (g.startsWith('A')) return 'A';
  if (g.startsWith('B')) return 'B';
  if (g.startsWith('C')) return 'C';
  if (g.startsWith('D')) return 'D';
  return 'F';
}
