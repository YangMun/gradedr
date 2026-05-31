/* ============================================================
   GradeR - App Entry Point
   Orchestrates module initialization in dependency order.
   ============================================================ */

import { initTheme, initNavigation } from './ui.js';
import { initSemesters } from './semesters.js';
import { renderTargetSection } from './targetGpa.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSemesters();        // renders tabs, loads subjects, wires form
  renderTargetSection();  // binds target GPA reverse calculator
  initNavigation();       // binds bottom nav, restores last section

  // Additional inits added by later feature branches:
  // import { renderSimulatorSection } from './simulator.js';  // feature/grade-simulator
  // import { initCharts }            from './charts.js';      // feature/grade-visualization
  // import { importFromUrl }         from './dataIO.js';      // feature/data-export-import
});
