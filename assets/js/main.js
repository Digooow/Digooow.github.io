/* ==========================================================================
   KAMASYLVIA REALM — MAIN SCRIPT
   - Fundo com Transição Dinâmica das Imagens do Jogo no Scroll
   - Canvas de Fadas Douradas com Asas Radiantes (Inspiradas nas Screenshots)
   - Interatividade da Pipeline CI/CD & Grimório CLI
   ========================================================================== */

'use strict';

// ─── 1. TRANSIÇÃO DINÂMICA DE IMAGENS DE FUNDO CONFORME O SCROLL ────────
(function initBackgroundSwitcher() {
  const slides = document.querySelectorAll('.bg-slide');
  if (!slides.length) return;

  const sections = [
    { id: 'home',      index: 0 }, // kamasylvia-fairies.jpg
    { id: 'pipeline',  index: 1 }, // grana-gazebo.jpg
    { id: 'projetos',  index: 2 }, // kamasylvia-waterfalls.jpg
    { id: 'terminal',  index: 3 }, // forest-stream.jpg
    { id: 'sobre',     index: 4 }, // kamasylve-sunset.jpg
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
})();

// ─── 2. FADAS E LUZES AMBIENTAIS ──────────────────────────────────────────
(function initFairyCanvas() {
  const canvas = document.getElementById('fairy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let fairies = [];
  let motes = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const palettes = [
    { body: '#fef3c7', wing: '#fbbf24', glow: '#f59e0b' },
    { body: '#d1fae5', wing: '#34d399', glow: '#10b981' },
    { body: '#cffafe', wing: '#67e8f9', glow: '#06b6d4' },
    { body: '#ede9fe', wing: '#c4b5fd', glow: '#8b5cf6' },
    { body: '#fce7f3', wing: '#f472b6', glow: '#ec4899' },
    { body: '#ffedd5', wing: '#fb923c', glow: '#f97316' },
    { body: '#e0e7ff', wing: '#818cf8', glow: '#6366f1' },
    { body: '#cffafe', wing: '#22d3ee', glow: '#0891b2' },
    { body: '#dcfce7', wing: '#84cc16', glow: '#65a30d' },
    { body: '#fae8ff', wing: '#e879f9', glow: '#c026d3' },
    { body: '#fef9c3', wing: '#fde047', glow: '#eab308' },
    { body: '#e0f2fe', wing: '#38bdf8', glow: '#0284c7' },
    { body: '#f1f5f9', wing: '#cbd5e1', glow: '#94a3b8' },
    { body: '#f5d0fe', wing: '#d946ef', glow: '#a21caf' },
    { body: '#ccfbf1', wing: '#2dd4bf', glow: '#0f766e' },
    { body: '#ffe4e6', wing: '#fb7185', glow: '#e11d48' },
    { body: '#fef3c7', wing: '#facc15', glow: '#ca8a04' },
    { body: '#dbeafe', wing: '#60a5fa', glow: '#2563eb' },
    { body: '#f3e8ff', wing: '#a78bfa', glow: '#7c3aed' },
    { body: '#d9f99d', wing: '#a3e635', glow: '#4d7c0f' }
  ];

  function createFairyPalette(index) {
    const hue = (index * 137.508 + (index % palettes.length) * 3.5) % 360;
    const saturation = 68 + (index % 4) * 5;
    const bodyLightness = 88 - (index % 3) * 4;
    const wingLightness = 62 + (index % 4) * 4;
    const glowLightness = 48 + (index % 3) * 5;
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
    let red = 0;
    let green = 0;
    let blue = 0;

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

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    fairies.forEach((fairy) => fairy.reposition());
    motes.forEach((mote) => mote.reposition());
  }

  class Fairy {
    constructor(depth = Math.random(), paletteIndex = 0) {
      this.phase = Math.random() * Math.PI * 2;
      this.palette = createFairyPalette(paletteIndex);
      this.scale = (0.28 + Math.random() * 0.42) * 0.9;
      this.depth = depth;
      this.scale *= 0.72 + this.depth * 0.85;
      this.opacity = 0.22 + this.depth * 0.7;
      this.glow = 0.55 + this.depth * 1.05 + Math.random() * 0.45;
      this.wingSpeed = 0.018 + Math.random() * 0.055;
      this.flightSpeed = 0.045 + Math.random() * 0.19;
      this.direction = Math.random() > 0.5 ? 1 : -1;
      this.reposition(true);
    }

    reposition(initial = false) {
      this.x = Math.random() * width;
      this.y = 38 + Math.random() * Math.max(1, height - 38);
      this.vx = this.flightSpeed * this.direction;
      this.vy = (Math.random() - 0.5) * 0.12;
      this.drift = 0.2 + Math.random() * 0.55;
      this.life = initial ? Math.random() * 1000 : 0;
    }

    update() {
      this.life += 1;
      this.phase += 0.009 + this.flightSpeed * 0.025;
      this.x += this.vx + Math.sin(this.phase * 1.7) * this.drift * 0.12;
      this.y += this.vy + Math.cos(this.phase) * this.drift * 0.08;

      if (this.x < -80 || this.x > width + 80 || this.y < 38 || this.y > height + 30) {
        this.reposition();
      }
    }

    draw() {
      const pulse = 0.78 + Math.sin(this.phase * 2) * 0.18;
      const alpha = this.opacity * pulse;
      const scale = this.scale;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.direction * scale, scale);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = rgba(this.palette.glow, 0.9);
      ctx.shadowBlur = 22 * this.glow;

      const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 70);
      aura.addColorStop(0, rgba(this.palette.wing, 0.6));
      aura.addColorStop(0.45, rgba(this.palette.glow, 0.16));
      aura.addColorStop(1, rgba(this.palette.glow, 0));
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();

      const wingFlutter = Math.sin(this.life * this.wingSpeed) * 0.16;
      ctx.strokeStyle = rgba(this.palette.body, 0.72);
      ctx.lineWidth = 1.2;

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
      ctx.lineTo(43, -3);
      ctx.stroke();
      ctx.restore();

      ctx.shadowBlur = 38 * this.glow;
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

  class Mote {
    constructor(depth = Math.random()) {
      this.phase = Math.random() * Math.PI * 2;
      this.radius = 0.7 + Math.random() * 2.1;
      this.depth = depth;
      this.radius *= 0.7 + this.depth * 0.8;
      this.opacity = 0.16 + this.depth * 0.58;
      this.glow = 0.45 + this.depth * 0.95 + Math.random() * 0.3;
      this.color = Math.random() > 0.32
        ? { core: '#fff7bf', light: '#facc15' }
        : { core: '#fef08a', light: '#eab308' };
      this.reposition(true);
    }

    reposition(initial = false) {
      this.x = Math.random() * width;
      this.y = 38 + Math.random() * Math.max(1, height - 38);
      this.vx = (Math.random() - 0.5) * 0.18;
      this.vy = (Math.random() - 0.5) * 0.12;
      this.life = initial ? Math.random() * 1000 : 0;
    }

    update() {
      this.life += 1;
      this.phase += 0.01;
      this.x += this.vx + Math.sin(this.phase * 1.5) * 0.04;
      this.y += this.vy + Math.cos(this.phase) * 0.04;
      if (this.x < -10 || this.x > width + 10 || this.y < 38 || this.y > height + 10) {
        this.reposition();
      }
    }

    draw() {
      const pulse = 0.72 + Math.sin(this.phase * 2.2) * 0.28;
      const glowRadius = this.radius * (8 + this.glow * 5);
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
      gradient.addColorStop(0, `${this.color.core}${Math.round(this.opacity * pulse * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.12, `${this.color.light}${Math.round(this.opacity * pulse * 0.72 * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.45, `${this.color.light}${Math.round(this.opacity * pulse * 0.16 * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${this.color.light}00`);
      ctx.save();
      ctx.shadowColor = this.color.light;
      ctx.shadowBlur = 18 * this.glow;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `${this.color.core}${Math.round(this.opacity * pulse * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnLights() {
    const isMobile = window.innerWidth < 768;
    const distantFairies = isMobile ? 24 : 48;
    const nearFairies = isMobile ? 2 : 4;
    const distantMotes = isMobile ? 48 : 96;
    const nearMotes = isMobile ? 4 : 8;

    fairies = [
      ...Array.from({ length: distantFairies }, (_, index) => new Fairy(
        0.05 + Math.random() * 0.28,
        index
      )),
      ...Array.from({ length: nearFairies }, (_, index) => new Fairy(
        0.68 + Math.random() * 0.32,
        distantFairies + index
      ))
    ];
    motes = [
      ...Array.from({ length: distantMotes }, () => new Mote(0.03 + Math.random() * 0.3)),
      ...Array.from({ length: nearMotes }, () => new Mote(0.7 + Math.random() * 0.3))
    ];
  }
  resize();
  spawnLights();
  window.addEventListener('resize', resize, { passive: true });

  function loop() {
    ctx.clearRect(0, 0, width, height);
    if (!reducedMotion.matches) {
      for (const fairy of fairies) {
        fairy.update();
        fairy.draw();
      }
      for (const mote of motes) {
        mote.update();
        mote.draw();
      }
      requestAnimationFrame(loop);
    }
  }
  loop();
})();

// ─── 3. INTERATIVIDADE DA PIPELINE CI/CD ─────────────────────────────────
window.selectPipelineStep = function(stepNum) {
  const stepsData = {
    1: {
      name: '01 - Git Push (Disparo)',
      details: 'Push detectado na branch main -> GitHub Actions inicializa o workflow de deploy automático.',
      log: '[event] push to refs/heads/main | sha: 8b495ca | runner: ubuntu-latest'
    },
    2: {
      name: '02 - Quality Gate',
      details: 'Executa checagem de integridade HTML e linters semânticos (cycjimmy/html-check-action@v2).',
      log: '[check] HTML syntax & tags validation passed. 0 errors, 0 warnings.'
    },
    3: {
      name: '03 - Artifact Build',
      details: 'Empacota arquivos estáticos via actions/upload-pages-artifact@v3.',
      log: '[artifact] Built bundle uploaded successfully. Ready for deployment.'
    },
    4: {
      name: '04 - Deploy to Pages',
      details: 'Implantação global nos servidores de borda do GitHub Pages via actions/deploy-pages@v4.',
      log: '[deploy] Live at https://digooow.github.io/ with HTTPS certificate active.'
    },
    5: {
      name: '05 - Lighthouse Audit',
      details: 'Auditoria de ponta a ponta avaliando performance, acessibilidade e SEO pós-publicação.',
      log: '[audit] Lighthouse Score: Performance: 100 | Accessibility: 100 | SEO: 100.'
    }
  };

  const info = stepsData[stepNum];
  if (!info) return;

  // Imprime feedback direto no console do Grimório
  const termOutput = document.getElementById('terminal-output');
  if (termOutput) {
    const div = document.createElement('div');
    div.className = 'my-2 p-2.5 rounded bg-emerald-950/70 border border-emerald-400/40 text-xs';
    div.innerHTML = `
      <div class="text-amber-300 font-bold mb-1">✦ Inspecionando Nó: ${info.name}</div>
      <div class="text-slate-200 mb-1">${info.details}</div>
      <div class="text-emerald-400 font-mono text-[11px]">${info.log}</div>
    `;
    termOutput.appendChild(div);
    termOutput.scrollTop = termOutput.scrollHeight;

    // Rola suavemente até o terminal se estiver longe
    const termSec = document.getElementById('terminal');
    if (termSec) {
      termSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
};

// ─── 4. TERMINAL ARCANO (CLI INTERATIVO) ─────────────────────────────────
(function initTerminal() {
  const output = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input');
  if (!output || !input) return;

  const COMMANDS = {
    help: () => [
      { text: '✦ GRIMÓRIO KAMASYLVIA CLI — Comandos:', cls: 'text-amber-300 font-bold' },
      { text: '  devops     → Status ao vivo da pipeline GitHub Actions', cls: 'text-emerald-300' },
      { text: '  skills     → Tecnologias, frameworks e ferramentas', cls: 'text-emerald-300' },
      { text: '  about      → Perfil e trajetória de Rodrigo da Cruz Godinho', cls: 'text-emerald-300' },
      { text: '  contact    → Links do GitHub, LinkedIn e LeetCode', cls: 'text-emerald-300' },
      { text: '  kama       → Conheça o Reino Élfico de Kamasylvia', cls: 'text-cyan-300' },
      { text: '  clear      → Limpar a tela do terminal', cls: 'text-slate-400' },
    ],

    devops: () => [
      { text: '✔ Pipeline CI/CD Status: ALL GATES PASSING', cls: 'text-emerald-300 font-bold' },
      { text: '  • Quality Gate: html-check-action [OK]', cls: 'text-slate-200' },
      { text: '  • Deployment: GitHub Pages Edge CDN [OK]', cls: 'text-slate-200' },
      { text: '  • Auditoria: Lighthouse CI Score: 100/100 [OK]', cls: 'text-slate-200' },
      { text: '  • Repositório: github.com/Digooow/Digooow.github.io', cls: 'text-amber-300' },
    ],

    skills: () => [
      { text: '✦ Stack Tecnológica & Especialidades:', cls: 'text-amber-300 font-bold' },
      { text: '  • Backend: .NET 8, C#, Node.js, Express, REST APIs', cls: 'text-slate-200' },
      { text: '  • Frontend: React, JavaScript Moderno, Tailwind CSS', cls: 'text-slate-200' },
      { text: '  • DevOps & Nuvem: GitHub Actions, Docker, Azure Cloud', cls: 'text-emerald-300' },
      { text: '  • Dados: Python, SQL Server, Análise de Dados', cls: 'text-cyan-300' },
    ],

    about: () => [
      { text: '✦ Rodrigo da Cruz Godinho', cls: 'text-amber-300 font-bold' },
      { text: '  Estudante de Desenvolvimento de Sistemas e IA no SENAC Joinville.', cls: 'text-slate-200' },
      { text: '  Apaixonado por código limpo, automação de processos e design moderno.', cls: 'text-slate-200' },
    ],

    contact: () => [
      { text: '✦ Conexões:', cls: 'text-amber-300 font-bold' },
      { text: '  GitHub:   https://github.com/Digooow', cls: 'text-emerald-300' },
      { text: '  LinkedIn: https://linkedin.com/in/digooow', cls: 'text-cyan-300' },
      { text: '  LeetCode: https://leetcode.com/digooow', cls: 'text-amber-300' },
    ],

    kama: () => [
      { text: '✦ Reino de Kamasylvia (Black Desert Online)', cls: 'text-amber-300 font-bold' },
      { text: '  Região ancestral guardada pelas elfas Ganelle e Vedir.', cls: 'text-slate-200' },
      { text: '  Lar da Árvore Sagrada Kamasylve, cachoeiras cristalinas e fadas de luz.', cls: 'text-slate-200' },
    ],

    clear: () => {
      output.innerHTML = '';
      return [];
    }
  };

  function appendLines(lines) {
    lines.forEach(item => {
      const p = document.createElement('p');
      p.className = `leading-relaxed ${item.cls || 'text-slate-200'}`;
      p.textContent = item.text;
      output.appendChild(p);
    });
    output.scrollTop = output.scrollHeight;
  }

  function handleCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    if (!cmd) return;

    // Eco do comando
    const eco = document.createElement('p');
    eco.className = 'text-slate-400 mt-2';
    eco.innerHTML = `<span class="text-emerald-400 font-bold">digooow@kama</span>:<span class="text-amber-400">~$</span> ${cmdRaw}`;
    output.appendChild(eco);

    if (COMMANDS[cmd]) {
      const res = COMMANDS[cmd]();
      appendLines(res);
    } else {
      appendLines([
        { text: `Comando não reconhecido: "${cmd}". Digite "help" para lista de opções.`, cls: 'text-rose-400' }
      ]);
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleCommand(input.value);
      input.value = '';
    }
  });

  window.runQuickCommand = function(cmd) {
    handleCommand(cmd);
    input.focus();
  };

  // Mensagem inicial de boot
  appendLines([
    { text: '✦ Sessão inicializada no Nó Kamasylve-1 [Kamasylvia Realm]', cls: 'text-emerald-300 font-bold' },
    { text: 'Digite "help" ou selecione um atalho para explorar a infraestrutura.', cls: 'text-slate-300' }
  ]);
})();

// ─── 5. MENU MOBILE ──────────────────────────────────────────────────────
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
}

window.closeMobileMenu = function() {
  if (mobileMenu) mobileMenu.classList.add('hidden');
};