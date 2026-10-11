/* ==========================================================================
   MOTE CLASS — Partículas Luminosas (Cache Offscreen com Degradê Perfeitamente Suave)
   ========================================================================== */

'use strict';

export class Mote {
  constructor(width, height, depth = Math.random()) {
    this.phase = Math.random() * Math.PI * 2;
    this.radius = 0.22 + Math.random() * 0.7;
    this.depth = depth;
    
    const distanceScale = this.depth < 0.06
      ? 0.32 + this.depth * 20
      : 0.44 + (this.depth - 0.006) * 19.7;
    this.radius *= distanceScale;
    
    const baseOpacity = (0.18 + this.depth * 0.5) * 1.7;
    this.opacity = this.depth < 0.02
      ? Math.min(0.9, baseOpacity + 0.3)
      : Math.min(1, baseOpacity);
      
    this.glow = (0.65 + this.depth * 0.9 + Math.random() * 0.4) * 1.1;
    this.detail = this.depth > 0.58;

    // Paleta exclusiva em tons elegantes de amarelo e dourado sol
    const colorVariants = [
      { core: '#fef9c3', light: '#fef08a' },
      { core: '#fef08a', light: '#facc15' },
      { core: '#fde047', light: '#eab308' },
      { core: '#fef3c7', light: '#f59e0b' }
    ];
    this.color = colorVariants[Math.floor(Math.random() * colorVariants.length)];

    this.cacheCanvas = null;
    this.cacheSize = 0;
    
    this.reposition(true, width, height);
  }

  getCanvasCache(effectiveRadius, pulse) {
    const size = Math.ceil(effectiveRadius * 35);
    if (this.cacheCanvas && Math.abs(this.cacheSize - size) < 2) {
      return this.cacheCanvas;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const diam = size * 2;
    canvas.width = diam;
    canvas.height = diam;

    const cx = size;
    const cy = size;
    const coreRadius = effectiveRadius * 0.95;
    const innerCoreRadius = coreRadius * 0.95;
    const glowRadius = effectiveRadius * (12.0 + this.glow * 6.0);
    const outerRadius = glowRadius * 3.5;

    ctx.save();
    ctx.shadowColor = this.color.light;
    ctx.shadowBlur = this.detail ? 42 * this.glow : 10;

    // Restaurado para 12 camadas no cache offscreen: máxima suavidade sem custo no loop principal
    const totalLayers = 12;
    for (let i = 0; i < totalLayers; i++) {
      const progress = i / (totalLayers - 1); // 0 (fora) até 1 (centro)
      
      const layerRadius = outerRadius * Math.pow(1 - progress, 1.35);
      const contrastCurve = Math.pow(progress, 3.8);
      const layerOpacity = Math.min(1, (0.0003 + contrastCurve * 1.9));
      
      const layerGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, layerRadius);
      
      const alphaInner = Math.round(layerOpacity * 255).toString(16).padStart(2, '0');
      const alphaMid = Math.round(layerOpacity * 0.2 * 255).toString(16).padStart(2, '0');
      const alphaLow = Math.round(layerOpacity * 0.05 * 255).toString(16).padStart(2, '0');
      const alphaEdge = Math.round(layerOpacity * 0.005 * 255).toString(16).padStart(2, '0');

      layerGradient.addColorStop(0, `${this.color.core}${alphaInner}`);
      layerGradient.addColorStop(0.25, `${this.color.light}${alphaMid}`);
      layerGradient.addColorStop(0.55, `${this.color.light}${alphaLow}`);
      layerGradient.addColorStop(0.85, `${this.color.light}${alphaEdge}`);
      layerGradient.addColorStop(1, `${this.color.light}00`);

      ctx.fillStyle = layerGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, layerRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Núcleo central luminoso puro
    const coreAlpha = Math.round(Math.min(1, 4.2 * (this.isSmallest ? 5.0 : 3.0)) * 255).toString(16).padStart(2, '0');
    ctx.fillStyle = `${this.color.core}${coreAlpha}`;
    ctx.beginPath();
    ctx.arc(cx, cy, innerCoreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.cacheCanvas = canvas;
    this.cacheSize = size;
    return canvas;
  }

  reposition(initial = false, width, height) {
    this.x = Math.random() * width;
    this.y = 38 + Math.random() * Math.max(1, height - 38);
    
    const speedFactor = 0.01 + Math.random() * 0.14;
    this.vx = (Math.random() - 0.5) * speedFactor;
    this.vy = (Math.random() - 0.5) * (speedFactor * 0.7);
    
    this.z = initial ? 0.2 + Math.random() * 0.8 : 0.1 + Math.random() * 0.3;
    this.zSpeed = (Math.random() - 0.48) * 0.0012;
    this.life = initial ? Math.random() * 1000 : 0;
  }

  update(width, height) {
    this.life += 1;
    this.phase += 0.01;
    
    this.x += this.vx + Math.sin(this.phase * 0.8) * 0.04;
    this.y += this.vy + Math.cos(this.phase * 0.7) * 0.03;

    this.z += this.zSpeed;
    if (this.z > 1.1) this.zSpeed = -Math.abs(this.zSpeed);
    if (this.z < 0.12) this.zSpeed = Math.abs(this.zSpeed);

    if (this.x < -30 || this.x > width + 30 || this.y < 38 || this.y > height + 30) {
      this.reposition(false, width, height);
    }
  }

  draw(ctx) {
    const pulse = 0.82 + Math.sin(this.phase * 2.2) * 0.18;
    const sizeScale = this.isLargest ? 0.55 : 1;
    const effectiveRadius = this.radius * sizeScale * 1.05 * (0.5 + 0.5 * this.z);

    if (this.depth < 0.15) {
      ctx.fillStyle = `${this.color.core}`;
      ctx.globalAlpha = Math.min(1, this.opacity * pulse * 2.6 * (this.isSmallest ? 4.5 : 2.5));
      ctx.beginPath();
      ctx.arc(this.x, this.y, effectiveRadius * 0.95 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      return;
    }

    const cachedImg = this.getCanvasCache(effectiveRadius, pulse);
    const halfSize = cachedImg.width / 2;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this.opacity * pulse);
    ctx.drawImage(cachedImg, this.x - halfSize, this.y - halfSize);
    ctx.restore();
  }
}