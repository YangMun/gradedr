/* ============================================================
   GradeR - App Entry Point
   Orchestrates module initialization in dependency order.
   ============================================================ */

import { initTheme, initNavigation } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();

  // Each feature branch adds its own import + init call here:
  // import { initSemesters } from './semesters.js';   // feature/gpa-calculator
  // import { renderTargetSection } from './targetGpa.js'; // feature/target-gpa
  // import { renderSimulatorSection } from './simulator.js'; // feature/grade-simulator
  // import { importFromUrl } from './dataIO.js';       // feature/data-export-import
});
