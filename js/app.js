/* ============================================================
   GradeR - App Entry Point
   Orchestrates module initialization in dependency order.
   ============================================================ */

import { initTheme, initNavigation } from './ui.js';
import { initSemesters } from './semesters.js';
import { renderTargetSection } from './targetGpa.js';
import { renderSimulatorSection } from './simulator.js';
import { initCharts } from './charts.js';
import { importFromUrl, initDataSection } from './dataIO.js';

document.addEventListener('DOMContentLoaded', () => {
  importFromUrl();          // must run first: may populate storage from ?d= URL param
  initTheme();
  initSemesters();          // renders tabs, loads subjects, wires form
  renderTargetSection();    // binds target GPA reverse calculator
  renderSimulatorSection(); // binds grade simulator
  initCharts();             // lazy renders charts on section visit
  initDataSection();        // binds export/import/share/reset buttons
  initNavigation();         // binds bottom nav, restores last section
});
