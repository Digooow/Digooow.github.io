/* ==========================================================================
   CANVAS ENGINE — Gerenciamento e Loop do Canvas
   ========================================================================== */

'use strict';

import { Fairy } from './fairy.js';
import { Mote } from './mote.js';

export function initFairyCanvas() {
  const canvas = document.getElementById('fairy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let renderScale = 1;
  let fairies = [];
  let motes = [];
  let animationFrame;
  let lastFrameTime = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderScale = Math.min(1, (window.devicePixelRatio || 1) * 1.0);
    canvas.width = Math.floor(width * renderScale);
    canvas.height = Math.floor(height * renderScale);
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  }

  function spawnLights() {
    fairies = [];
    motes = [];

    const isMobile = window.innerWidth < 768;
    const fairyCount = isMobile ? 14 : 26;
    for (let i = 0; i < fairyCount; i++) {
      fairies.push(new Fairy(i, width, height));
    }

    const moteCount = isMobile ? 55 : 100;
    for (let i = 0; i < moteCount; i++) {
      motes.push(new Mote(width, height));
    }
  }

  resize();
  spawnLights();
  window.addEventListener('resize', () => {
    resize();
    spawnLights();
  }, { passive: true });

  function loop() {
    animationFrame = requestAnimationFrame(loop);
    if (reducedMotion.matches || document.hidden) return;

    const now = performance.now();
    if (now - lastFrameTime < 33) return;
    lastFrameTime = now;

    ctx.clearRect(0, 0, width, height);

    for (const fairy of fairies) {
      fairy.update(width, height);
    }
    for (const mote of motes) {
      mote.update(width, height);
    }

    const allEntities = [...fairies, ...motes];
    allEntities.sort((a, b) => a.z - b.z);

    for (const entity of allEntities) {
      entity.draw(ctx);
    }
  }

  loop();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastFrameTime = 0;
      cancelAnimationFrame(animationFrame);
      loop();
    }
  });
}