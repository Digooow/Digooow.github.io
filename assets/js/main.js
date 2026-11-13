/* ==========================================================================
   MAIN ENTRY POINT
   ========================================================================== */

'use strict';

import { initBackgroundSwitcher } from './background-switcher.js';
import { initFairyCanvas } from './canvas-engine.js';
import { initTerminalAndPipeline } from './terminal-cli.js';
import { initGitHubTelemetry } from './github-telemetry.js';

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundSwitcher();
  initFairyCanvas();
  initTerminalAndPipeline();
  initGitHubTelemetry();

  // Menu Mobile
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    const closeMobileMenu = () => {
      mobileMenu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    };

    menuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!isHidden));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        closeMobileMenu();
        menuBtn.focus();
      }
    });
  }
});