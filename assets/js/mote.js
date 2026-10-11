/* ==========================================================================
   MOTE CLASS — Partículas Luminosas com Cache de Textura Compartilhado e Bloom
   ========================================================================== */

'use strict';

// 1. Paletas ricas com cores vivas e alta saturação luminosa
const COLOR_VARIANTS = [
  // Ouro Solar Incandescente (Sol radiante e ouro quente)
  {
    outer:   [234, 150, 8],    // Âmbar dourado vivo
    ambient: [250, 190, 20],   // Ouro vibrante
    glow:    [253, 218, 50],   // Amarelo sol luminoso
    warm:    [254, 240, 138],  // Luz quente rica
    inner:   [255, 252, 220]   // Marfim incandescente
  },
  // Âmbar Mel Mágico (Fogo fátuo e mel luminoso)
  {
    outer:   [217, 100, 10],   // Âmbar avermelhado vivo
    ambient: [245, 150, 15],   // Laranja mel vibrante
    glow:    [251, 191, 36],   // Ouro âmbar
    warm:    [253, 224, 71],   // Amarelo quente
    inner:   [255, 246, 210]   // Pérola dourada
  },
  // Estrela Dourada Cristalina (Luz élfica cintilante)
  {
    outer:   [202, 138, 4],    // Ouro clássico
    ambient: [234, 179, 8],    // Dourado puro
    glow:    [250, 204, 21],   // Ouro vivo
    warm:    [254, 240, 138],  // Amarelo claro
    inner:   [255, 255, 230]   // Branco estelar quente
  },
  // Luz Alvorada Solar (Aura solar quente)
  {
    outer:   [234, 88, 12],    // Âmbar solar
    ambient: [249, 115, 22],   // Laranja solar
    glow:    [251, 146, 60],   // Pêssego dourado luminoso
    warm:    [253, 186, 116],  // Champanhe quente
    inner:   [255, 250, 240]   // Branco alvorada
  }
];

// 2. Cache estático compartilhado em 512x512 para projeção atmosférica ultra-suave
const SPRITE_SIZE = 512;
let sharedSprites = null;

function rgba(c, a) {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

function getSharedSprites() {
  if (sharedSprites) return sharedSprites;

  sharedSprites = COLOR_VARIANTS.map(variant => {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_SIZE;
    canvas.height = SPRITE_SIZE;
    const ctx = canvas.getContext('2d');
    
    const center = SPRITE_SIZE / 2;
    const maxRadius = center - 2;

    // Núcleo pontual microscópico + Área externa massivamente expandida
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, maxRadius);
    
    // NÚCLEO INTERNO REDUZIDO AO MÁXIMO (Apenas ~1-2% do raio)
    gradient.addColorStop(0.000, 'rgba(255, 255, 255, 1.0)');     // 255 Branco puro de brilho máximo
    gradient.addColorStop(0.008, 'rgba(255, 255, 255, 0.95)');    // Faísca central pontual minúscula
    gradient.addColorStop(0.025, rgba(variant.inner, 0.78));       // Queda rápida do núcleo compacto
    gradient.addColorStop(0.060, rgba(variant.warm, 0.52));        // Transição imediata de saída
    
    // ÁREA EXTERNA EXPANDIDA AO MÁXIMO (Ocupa ~94% de todo o raio)
    gradient.addColorStop(0.120, rgba(variant.glow, 0.32));        // Luz viva já se abrindo em halo suave
    gradient.addColorStop(0.220, rgba(variant.ambient, 0.18));     // Expansão atmosférica contínua
    gradient.addColorStop(0.380, rgba(variant.ambient, 0.10));     // Difusão de cor ampla
    gradient.addColorStop(0.560, rgba(variant.outer, 0.05));       // Penumbra suave que vai muito longe
    gradient.addColorStop(0.740, rgba(variant.outer, 0.022));      // Dispersão tênue (~5/255)
    gradient.addColorStop(0.880, rgba(variant.outer, 0.008));      // Transição sutil (~2/255)
    gradient.addColorStop(0.960, rgba(variant.outer, 0.002));      // Próximo de zero (<1/255)
    gradient.addColorStop(1.000, rgba(variant.outer, 0.000));      // 0 absoluto na extremidade

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  });

  return sharedSprites;
}

export class Mote {
  constructor(width, height, depth = Math.random()) {
    this.phase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 1.3 + Math.random() * 1.4;
    
    // Variação individual para diversidade orgânica
    this.individualSize = 0.90 + Math.random() * 0.45; // 0.90 a 1.35
    this.intensityBase = 0.82 + Math.random() * 0.18;  // 0.82 a 1.00

    this.colorIndex = Math.floor(Math.random() * COLOR_VARIANTS.length);

    this.reposition(true, width, height);
  }

  reposition(initial = false, width, height) {
    this.x = Math.random() * width;
    this.y = 38 + Math.random() * Math.max(1, height - 38);
    
    const speedFactor = 0.02 + Math.random() * 0.16;
    this.vx = (Math.random() - 0.5) * speedFactor;
    this.vy = (Math.random() - 0.5) * (speedFactor * 0.7);
    
    // Z simula o espaço 3D (0.15 = fundo distante | 1.15 = perto da tela)
    this.z = initial ? 0.15 + Math.random() * 0.85 : 0.15 + Math.random() * 0.35;
    this.zSpeed = (Math.random() - 0.48) * 0.0022; // Movimento orgânico contínuo em profundidade
    this.life = initial ? Math.random() * 1000 : 0;
  }

  update(width, height) {
    this.life += 1;
    this.phase += 0.01;
    
    this.x += this.vx + Math.sin(this.phase * 0.8) * 0.05;
    this.y += this.vy + Math.cos(this.phase * 0.7) * 0.04;

    this.z += this.zSpeed;
    if (this.z > 1.15) this.zSpeed = -Math.abs(this.zSpeed);
    if (this.z < 0.14) this.zSpeed = Math.abs(this.zSpeed);

    if (this.x < -160 || this.x > width + 160 || this.y < 10 || this.y > height + 160) {
      this.reposition(false, width, height);
    }
  }

  draw(ctx) {
    const sprites = getSharedSprites();
    const sprite = sprites[this.colorIndex];

    const pulse = 0.88 + Math.sin(this.phase * this.pulseSpeed) * 0.12;
    
    // Proximidade normalizada (0.0 no fundo | 1.0 mais perto do observador)
    const proximity = Math.max(0, Math.min(1, (this.z - 0.14) / 0.98));
    
    // ÁREA EXTERNA EXPANDIDA (A LUZ PROJETA HALOS AMPLOS QUE SE FUSIONAM):
    // Longe: raio de ~90px a 125px (diâmetro 180-250px)
    // Perto: raio de ~220px a 330px (diâmetro 440-660px) de difusão de luz suave
    const renderRadius = (90 + proximity * 180) * this.individualSize * pulse;
    const renderDiam = renderRadius * 2;

    // BRILHO E INTENSIDADE:
    // O núcleo puro queima forte com modo aditivo, enquanto o halo amplo se acumula de forma orgânica
    const brightness = (0.38 + proximity * 0.60) * this.intensityBase * pulse;

    ctx.save();
    // Modo aditivo: onde os halos amplos se cruzam, a luz se soma suavemente, simulando iluminação real
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1.0, brightness);
    
    // Renderização direta via GPU da sprite de 512px
    ctx.drawImage(
      sprite,
      this.x - renderRadius,
      this.y - renderRadius,
      renderDiam,
      renderDiam
    );
    
    ctx.restore();
  }
}