/* ============================================================
   GradeR - Storage Module
   Foundation module: all LocalStorage reads/writes go through here.
   Zero external dependencies.
   ============================================================ */

const STORAGE_KEY = 'gradedr_data';
const CURRENT_VERSION = 3;

function makeDefaultData() {
  return {
    version: CURRENT_VERSION,
    settings: {
      theme: 'light',
      defaultGradeScale: '4.5',
      activeSection: 'section-calculator',
      activeSemesterId: 'sem_1_1',
      graduationCredits: 0,
      scholarships: []
    },
    semesters: [
      { id: 'sem_1_1', label: '1-1학기', gradeScale: '4.5', subjects: [] },
      { id: 'sem_1_2', label: '1-2학기', gradeScale: '4.5', subjects: [] },
      { id: 'sem_2_1', label: '2-1학기', gradeScale: '4.5', subjects: [] },
      { id: 'sem_2_2', label: '2-2학기', gradeScale: '4.5', subjects: [] }
    ]
  };
}

function migrateIfNeeded(data) {
  if (!data || typeof data !== 'object') return makeDefaultData();
  if (typeof data.version !== 'number') return makeDefaultData();

  // v1 → v2: graduationCredits + subject.type
  if (data.version < 2) {
    if (!data.settings) data.settings = {};
    if (data.settings.graduationCredits === undefined) data.settings.graduationCredits = 0;
    if (Array.isArray(data.semesters)) {
      data.semesters.forEach(sem => {
        if (Array.isArray(sem.subjects)) {
          sem.subjects.forEach(s => { if (!s.type) s.type = 'major'; });
        }
      });
    }
    data.version = 2;
  }

  // v2 → v3: scholarships + subject.retake + subject.memo
  if (data.version < 3) {
    if (!data.settings) data.settings = {};
    if (!Array.isArray(data.settings.scholarships)) data.settings.scholarships = [];
    if (Array.isArray(data.semesters)) {
      data.semesters.forEach(sem => {
        if (Array.isArray(sem.subjects)) {
          sem.subjects.forEach(s => {
            if (s.retake === undefined) s.retake = false;
            if (s.memo === undefined) s.memo = '';
          });
        }
      });
    }
    data.version = 3;
  }

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  return data;
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultData();
    return migrateIfNeeded(JSON.parse(raw));
  } catch {
    return makeDefaultData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[GradeR] LocalStorage write failed:', e);
  }
}

export function getSettings() {
  return loadData().settings;
}

export function patchSettings(patch) {
  const data = loadData();
  data.settings = { ...data.settings, ...patch };
  saveData(data);
  return data.settings;
}

export function getSemesters() {
  return loadData().semesters;
}

export function saveSemesters(semesters) {
  const data = loadData();
  data.semesters = semesters;
  saveData(data);
}

export function getSubjects(semesterId) {
  const sem = getSemesters().find(s => s.id === semesterId);
  return sem ? sem.subjects : [];
}

export function saveSubjects(semesterId, subjects) {
  const data = loadData();
  const sem = data.semesters.find(s => s.id === semesterId);
  if (sem) {
    sem.subjects = subjects;
    saveData(data);
  }
}

export function getSemesterScale(semesterId) {
  const sem = getSemesters().find(s => s.id === semesterId);
  return sem ? sem.gradeScale : '4.5';
}

export function setSemesterScale(semesterId, scale) {
  const data = loadData();
  const sem = data.semesters.find(s => s.id === semesterId);
  if (sem) {
    sem.gradeScale = scale;
    saveData(data);
  }
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
