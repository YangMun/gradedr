/* ============================================================
   GradeR - App Entry Point
   Orchestrates module initialization in dependency order.
   ============================================================ */

import { initTheme, initNavigation } from './ui.js';
import { initSemesters } from './semesters.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSemesters();  // renders tabs, loads subjects, wires form
  initNavigation(); // binds bottom nav, restores last section

  // Additional inits added by later feature branches:
  // import { renderTargetSection }   from './targetGpa.js';   // feature/target-gpa
  // import { renderSimulatorSection } from './simulator.js';  // feature/grade-simulator
  // import { initCharts }            from './charts.js';      // feature/grade-visualization
  // import { importFromUrl }         from './dataIO.js';      // feature/data-export-import
});
