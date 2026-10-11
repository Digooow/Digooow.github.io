/* ==========================================================================
   BACKGROUND SWITCHER — Transição de Fundo no Scroll
   ========================================================================== */

'use strict';

export function initBackgroundSwitcher() {
  const slides = document.querySelectorAll('.bg-slide');
  if (!slides.length) return;

  const sections = [
    { id: 'home',      index: 0 },
    { id: 'pipeline',  index: 1 },
    { id: 'projetos',  index: 2 },
    { id: 'terminal',  index: 3 },
    { id: 'sobre',     index: 4 },
  ];

  function updateBackground() {
    const scrollPos = window.scrollY + window.innerHeight * 0.45;
    let activeIndex = 0;
    for (const sec of sections) {
      const el = document.getElementById(sec.id);
      if (el && scrollPos >= el.offsetTop) {
        activeIndex = sec.index;
      }
    }

    slides.forEach((slide, idx) => {
      if (idx === activeIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateBackground, { passive: true });
  updateBackground();
}