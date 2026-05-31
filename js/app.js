/* ============================================================
   GradeR - App Entry Point
   Orchestrates module initialization in dependency order.
   ============================================================ */

import { initTheme, initNavigation } from './ui.js';
import { initSubjectForm } from './calculator.js';
import { initSemesters } from './semesters.js';
import { renderTargetSection } from './targetGpa.js';
import { renderSimulatorSection } from './simulator.js';
import { initCharts } from './charts.js';
import { importFromUrl, initDataSection } from './dataIO.js';
import { initGraduation } from './graduation.js';

document.addEventListener('DOMContentLoaded', () => {
  importFromUrl();           // must run first: may populate storage from ?d= URL param
  initTheme();
  initSubjectForm();         // bind form listeners once (before semesters activate)
  initSemesters();           // render tabs, load subjects, sync UI
  renderTargetSection();     // bind target GPA reverse calculator
  renderSimulatorSection();  // bind grade simulator
  initCharts();              // lazy render charts on section visit
  initDataSection();         // bind export/import/share/reset buttons
  initGraduation();          // bind graduation credits goal
  initNavigation();          // bind bottom nav, restore last section
});
