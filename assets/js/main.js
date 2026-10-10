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

// ─── 2. CANVAS DE FADAS DOURADAS E ESPÍRITOS DE LUZ (BDO INSPIRED) ───────
(function initFairyCanvas() {
  const canvas = document.getElementById('fairy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  let mouse = { x: -1000, y: -1000 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  class FairyParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 20;
      this.size = Math.random() * 2.8 + 1.2;
      this.speedY = -(Math.random() * 0.6 + 0.2);
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.life = 0;
      this.maxLife = Math.random() * 400 + 200;
      this.wingAngle = Math.random() * Math.PI * 2;
      this.wingSpeed = Math.random() * 0.15 + 0.08;

      // 30% são Fadas Douradas com Asas Luminosas (como no print da floresta)
      this.isFairy = Math.random() < 0.35;

      // Paleta: Dourado Âmbar, Esmeralda, Ciano Élfico ou Pérola
      const colors = [
        { r: 251, g: 191, b: 36 },  // Dourado
        { r: 245, g: 158, b: 11 },  // Âmbar
        { r: 16,  g: 185, b: 129 }, // Esmeralda
        { r: 52,  g: 211, b: 153 }, // Verde Menta
        { r: 6,   g: 182, b: 212 }, // Ciano
        { r: 254, g: 240, b: 138 }, // Luz Dourada
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.life++;
      this.wingAngle += this.wingSpeed;

      // Movimento oscilatório suave
      this.x += this.speedX + Math.sin(this.wingAngle) * 0.4;
      this.y += this.speedY;

      // Reação sutil ao mouse
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        this.x += (dx / dist) * 1.5;
        this.y += (dy / dist) * 1.5;
      }

      if (this.life >= this.maxLife || this.y < -30) {
        this.reset();
      }
    }

    draw() {
      const progress = this.life / this.maxLife;
      let alpha = 1;
      if (progress < 0.15) alpha = progress / 0.15;
      else if (progress > 0.8) alpha = (1 - progress) / 0.2;
      alpha *= 0.85;

      const { r, g, b } = this.color;

      if (this.isFairy) {
        // Desenha Fada com Asas de Luz
        const wingSpan = this.size * 3.5;
        const wingFlap = Math.sin(this.wingAngle) * 0.6 + 0.8;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Asa Esquerda
        ctx.beginPath();
        ctx.ellipse(-wingSpan * 0.6, 0, wingSpan * 0.8, wingSpan * 0.4 * wingFlap, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha * 0.45})`;
        ctx.fill();

        // Asa Direita
        ctx.beginPath();
        ctx.ellipse(wingSpan * 0.6, 0, wingSpan * 0.8, wingSpan * 0.4 * wingFlap, Math.PI / 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha * 0.45})`;
        ctx.fill();

        // Núcleo Dourado Brilhante
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
        ctx.fill();

        ctx.restore();
      } else {
        // Esfera de Luz Espiritual com Halo
        const glowRadius = this.size * 4;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Centro brilhante
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.fill();
      }
    }
  }

  function spawnParticles() {
    const count = window.innerWidth < 768 ? 40 : 85;
    particles = Array.from({ length: count }, () => new FairyParticle());
  }
  spawnParticles();
  window.addEventListener('resize', spawnParticles, { passive: true });

  function loop() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(loop);
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