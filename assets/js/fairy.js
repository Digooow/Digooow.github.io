/* ==========================================================================
   FAIRY CLASS — Modelo, Física e Renderização 3D
   ========================================================================== */

'use strict';

const FAIRY_PALETTES = [
  { body: '#fef3c7', wing: '#fbbf24', glow: '#f59e0b' },
  { body: '#d1fae5', wing: '#34d399', glow: '#10b981' },
  { body: '#cffafe', wing: '#67e8f9', glow: '#06b6d4' },
  { body: '#ede9fe', wing: '#c4b5fd', glow: '#8b5cf6' },
  { body: '#fce7f3', wing: '#f472b6', glow: '#ec4899' },
  { body: '#ffedd5', wing: '#fb923c', glow: '#f97316' },
  { body: '#e0e7ff', wing: '#818cf8', glow: '#6366f1' },
  { body: '#cffafe', wing: '#22d3ee', glow: '#0891b2' },
  { body: '#dcfce7', wing: '#84cc16', glow: '#65a30d' },
  { body: '#fae8ff', wing: '#e879f9', glow: '#c026d3' }
];

function createFairyPalette(index) {
  const hue = (index * 137.508 + (index % FAIRY_PALETTES.length) * 3.7) % 360;
  const saturation = 98 + (index % 4) * 4;
  const bodyLightness = 88 - (index % 3) * 4;
  const wingLightness = 88 + (index % 4) * 4;
  const glowLightness = 50 + (index % 3) * 4;
  return {
    body: hslToRgb(hue, saturation, bodyLightness),
    wing: hslToRgb(hue, saturation + 8, wingLightness),
    glow: hslToRgb(hue, saturation + 12, glowLightness)
  };
}

function hslToRgb(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = l - chroma / 2;
  let red = 0, green = 0, blue = 0;

  if (segment < 1) [red, green, blue] = [chroma, x, 0];
  else if (segment < 2) [red, green, blue] = [x, chroma, 0];
  else if (segment < 3) [red, green, blue] = [0, chroma, x];
  else if (segment < 4) [red, green, blue] = [0, x, chroma];
  else if (segment < 5) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return {
    red: Math.round((red + match) * 255),
    green: Math.round((green + match) * 255),
    blue: Math.round((blue + match) * 255)
  };
}

function rgba(color, alpha) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
}

export class Fairy {
  constructor(paletteIndex = 0, width, height) {
    this.palette = createFairyPalette(paletteIndex);
    this.reposition(true, width, height);
  }

  reposition(initial = false, width, height) {
    this.x = Math.random() * width;
    this.y = 38 + Math.random() * Math.max(1, height - 38);
    this.z = initial ? 0.1 + Math.random() * 0.8 : 0.1 + Math.random() * 0.3;

    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle;
    this.erraticism = Math.random(); 
    this.speed = 0.08 + Math.random() * 0.52;
    this.currentSpeed = this.speed;

    this.nextDirectionChange = Math.floor(20 + Math.random() * (1 - this.erraticism) * 250);
    this.turnSeverity = 0.02 + this.erraticism * 0.12;

    const rand = Math.random();
    if (rand < 0.65) {
      this.zBehavior = 0;
      this.zSpeed = (Math.random() - 0.5) * 0.002;
    } else if (rand < 0.88) {
      this.zBehavior = 1;
      this.zSpeed = -0.0008 - Math.random() * 0.002;
    } else {
      this.zBehavior = 2;
      this.zSpeed = 0.002 + Math.random() * 0.004;
    }

    this.phase = Math.random() * Math.PI * 2;
    this.noiseOffset = Math.random() * 1000;
    this.wingSpeed = 0.15 + (this.speed * 0.4) + Math.random() * 0.1;
  }

  update(width, height) {
    this.phase += 0.015;
    this.noiseOffset += 0.01;

    this.nextDirectionChange--;
    if (this.nextDirectionChange <= 0) {
      const angleShift = (Math.random() - 0.5) * Math.PI * (0.3 + this.erraticism * 1.2);
      this.targetAngle += angleShift;
      this.currentSpeed = this.speed * (0.5 + Math.random() * 0.9);
      this.nextDirectionChange = Math.floor(20 + (1 - this.erraticism) * 200 + Math.random() * 80);
    }

    this.angle += (this.targetAngle - this.angle) * this.turnSeverity;

    const waveNoiseX = Math.sin(this.phase * 1.7 + this.noiseOffset) * 0.3;
    const waveNoiseY = Math.cos(this.phase * 1.3 + this.noiseOffset) * 0.3;

    const effectiveSpeed = this.currentSpeed * (0.4 + 0.6 * Math.min(1.5, this.z));
    this.x += (Math.cos(this.angle) + waveNoiseX) * effectiveSpeed;
    this.y += (Math.sin(this.angle) + waveNoiseY) * effectiveSpeed * 0.8;

    this.z += this.zSpeed;
    if (this.zBehavior === 0) {
      if (this.z > 0.92) { this.zSpeed = -Math.abs(this.zSpeed); }
      if (this.z < 0.12) { this.zSpeed = Math.abs(this.zSpeed); }
    }

    if (this.z < 0.04 || this.z > 3.5) {
      this.reposition(false, width, height);
    }

    const margin = 120 * Math.max(1, this.z);
    if (this.x < -margin || this.x > width + margin || this.y < 38 - margin || this.y > height + margin) {
      if (this.z > 1.2) {
        this.reposition(false, width, height);
      } else {
        if (this.x < -margin) this.x = width + margin;
        if (this.x > width + margin) this.x = -margin;
        if (this.y < 38 - margin) this.y = height + margin;
        if (this.y > height + margin) this.y = 38 - margin;
      }
    }
  }

  draw(ctx) {
    const baseScale = 0.7;
    const scale = baseScale * this.z;

    let alpha = 1.0;
    if (this.z <= 1.0) {
      const pulse = 0.78 + Math.sin(this.phase * 2) * 0.18;
      const opacity = 0.25 + (this.z * 0.75);
      alpha = Math.min(1, opacity * pulse);
    } else {
      alpha = Math.max(0, 1.0 - (this.z - 1.0) / 2.5);
    }

    if (alpha <= 0.01) return;

    const glow = Math.min(2.5, 0.4 + (this.z * 0.8));

    ctx.save();
    ctx.translate(this.x, this.y);
    const direction = Math.cos(this.angle) >= 0 ? 1 : -1;
    ctx.scale(direction * scale, scale);
    ctx.globalAlpha = alpha;

    ctx.shadowColor = rgba(this.palette.glow, 0.9);
    ctx.shadowBlur = 22 * glow;

    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 70);
    aura.addColorStop(0, rgba(this.palette.wing, 0.6));
    aura.addColorStop(0.45, rgba(this.palette.glow, 0.16));
    aura.addColorStop(1, rgba(this.palette.glow, 0));
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();

    const wingFlutter = Math.sin(this.phase * 3.5 * this.wingSpeed) * 0.18;
    ctx.strokeStyle = rgba(this.palette.body, 0.72);
    ctx.lineWidth = 1.2;

    // Asa Esquerda
    ctx.save();
    ctx.rotate(-0.22 + wingFlutter);
    const leftWing = ctx.createRadialGradient(-22, -12, 2, -25, -12, 42);
    leftWing.addColorStop(0, rgba(this.palette.body, 0.92));
    leftWing.addColorStop(0.35, rgba(this.palette.wing, 0.72));
    leftWing.addColorStop(0.82, rgba(this.palette.glow, 0.3));
    leftWing.addColorStop(1, rgba(this.palette.glow, 0));
    ctx.fillStyle = leftWing;
    ctx.beginPath();
    ctx.ellipse(-25, -12, 38, 18, Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = rgba(this.palette.body, 0.52);
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.lineTo(-50, -30);
    ctx.moveTo(-12, -13);
    ctx.lineTo(-43, -3);
    ctx.stroke();
    ctx.restore();

    // Asa Direita
    ctx.save();
    ctx.rotate(0.22 - wingFlutter);
    const rightWing = ctx.createRadialGradient(22, -12, 2, 25, -12, 42);
    rightWing.addColorStop(0, rgba(this.palette.body, 0.92));
    rightWing.addColorStop(0.35, rgba(this.palette.wing, 0.72));
    rightWing.addColorStop(0.82, rgba(this.palette.glow, 0.3));
    rightWing.addColorStop(1, rgba(this.palette.glow, 0));
    ctx.fillStyle = rightWing;
    ctx.beginPath();
    ctx.ellipse(25, -12, 38, 18, -Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = rgba(this.palette.body, 0.52);
    ctx.beginPath();
    ctx.moveTo(2, -9);
    ctx.lineTo(50, -30);
    ctx.moveTo(12, -13);
    ctx.lineTo(-43, -3);
    ctx.stroke();
    ctx.restore();

    // Corpo
    ctx.shadowBlur = 38 * glow;
    const bodyGradient = ctx.createLinearGradient(0, -22, 0, 28);
    bodyGradient.addColorStop(0, rgba(this.palette.body, 1));
    bodyGradient.addColorStop(0.45, rgba(this.palette.wing, 0.96));
    bodyGradient.addColorStop(1, rgba(this.palette.glow, 0.48));
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = rgba(this.palette.body, 0.86);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -18, 5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, -23);
    ctx.quadraticCurveTo(-10, -18, -8, -10);
    ctx.quadraticCurveTo(-5, -24, 0, -25);
    ctx.quadraticCurveTo(5, -24, 8, -10);
    ctx.quadraticCurveTo(10, -18, 5, -23);
    ctx.fillStyle = rgba(this.palette.glow, 0.68);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.bezierCurveTo(-8, -6, -8, 8, -18, 27);
    ctx.quadraticCurveTo(0, 21, 18, 27);
    ctx.bezierCurveTo(8, 8, 8, -6, 0, -11);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = rgba(this.palette.wing, 0.9);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.quadraticCurveTo(-19, -25, -40, -28);
    ctx.moveTo(4, -9);
    ctx.quadraticCurveTo(19, -25, 40, -28);
    ctx.moveTo(-5, -2);
    ctx.quadraticCurveTo(-11, 10, -24, 22);
    ctx.moveTo(5, -2);
    ctx.quadraticCurveTo(11, 10, 24, 22);
    ctx.stroke();

    ctx.restore();
  }
}