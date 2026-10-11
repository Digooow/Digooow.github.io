/* ==========================================================================
   MAIN ENTRY POINT
   ========================================================================== */

'use strict';

import { initBackgroundSwitcher } from './background-switcher.js';
import { initFairyCanvas } from './canvas-engine.js';
import { initTerminalAndPipeline } from './terminal-cli.js';

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundSwitcher();
  initFairyCanvas();
  initTerminalAndPipeline();

  // Menu Mobile
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
});