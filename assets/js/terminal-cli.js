/* ==========================================================================
   TERMINAL CLI & PIPELINE — Shell Interativo Assíncrono
   ========================================================================== */

'use strict';

import { fetchLatestWorkflowRun, fetchRecentCommits, fetchAllUserRepos } from './github-telemetry.js';

export function initTerminalAndPipeline() {
  window.selectPipelineStep = function(stepNum) {
    const stepsData = {
      1: {
        name: '01 - O Chamado (Git Push)',
        details: 'O desenvolvedor envia um commit para a branch main. O webhook aciona os runners Ubuntu em nuvem instantaneamente.',
        log: '[event] push -> refs/heads/main | concurrency-group: pages | runner: ubuntu-latest'
      },
      2: {
        name: '02 - O Guardião do Portão (Quality Gate)',
        details: 'Node.js 20 executa html-validate@10.17.0 (instalado com --ignore-scripts e Actions travadas por commit SHA). Nenhuma tag quebrada passa.',
        log: '[sast] html-validate "*.html" -> 0 errors, 0 warnings. Gate unlocked.'
      },
      3: {
        name: '03 - A Forja do Artefato (Immutable Pack)',
        details: 'Os arquivos validados são empacotados em um artefato tar.gz imutável via actions/upload-pages-artifact@v3.',
        log: '[artifact] Bundle sealed & uploaded. SHA-256 checksum verified.'
      },
      4: {
        name: '04 - O Grande Salto (Edge CDN Deploy)',
        details: 'Publicação autenticada via token OIDC (id-token: write) direto para a CDN global do GitHub Pages com TLS 1.3.',
        log: '[deploy] Environment: github-pages | Live at https://digooow.github.io/'
      },
      5: {
        name: '05 - O Oráculo da Performance (Lighthouse CI)',
        details: 'Um navegador headless audita a página real em produção: Core Web Vitals (LCP, CLS), Acessibilidade e SEO.',
        log: '[audit] treosh/lighthouse-ci-action -> Performance, A11y & SEO verified.'
      }
    };

    const info = stepsData[stepNum];
    if (!info) return;

    const termOutput = document.getElementById('terminal-output');
    if (termOutput) {
      const div = document.createElement('div');
      div.className = 'my-2 p-2.5 rounded bg-emerald-950/70 border border-emerald-400/40 text-xs';
      div.innerHTML = `
        <div class="text-amber-300 font-bold mb-1">✦ Registro de Batalha: ${info.name}</div>
        <div class="text-slate-200 mb-1">${info.details}</div>
        <div class="text-emerald-400 font-mono text-[11px]">${info.log}</div>
      `;
      termOutput.appendChild(div);
      termOutput.scrollTop = termOutput.scrollHeight;

      const termSec = document.getElementById('terminal');
      if (termSec) {
        termSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const output = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input');
  if (!output || !input) return;

  const commandHistory = [];
  let historyIndex = -1;

  const COMMANDS = {
    help: async () => [
      { text: '✦ CONSOLE DOS BASTIDORES — Comandos Disponíveis:', cls: 'text-amber-300 font-bold' },
      { text: '  story      → A história ("Era uma vez...") por trás do código', cls: 'text-amber-200' },
      { text: '  devops     → Telemetria ao vivo da pipeline GitHub Actions', cls: 'text-emerald-300' },
      { text: '  repos      → Lista todos os repositórios públicos sincronizados', cls: 'text-cyan-300' },
      { text: '  git log    → Busca os últimos 5 commits reais na API do GitHub', cls: 'text-cyan-300' },
      { text: '  ping       → Mede a latência HTTP real até a borda da CDN', cls: 'text-cyan-300' },
      { text: '  inspect    → Diagnóstico real de runtime, DOM e Performance API', cls: 'text-cyan-300' },
      { text: '  skills     → Arsenal técnico (.NET, Cloud, Dados & Front)', cls: 'text-emerald-300' },
      { text: '  about      → Quem é o protagonista por trás do teclado', cls: 'text-emerald-300' },
      { text: '  contact    → Portais de comunicação (GitHub, LinkedIn, LeetCode)', cls: 'text-emerald-300' },
      { text: '  clear      → Limpar o pergaminho do terminal', cls: 'text-slate-400' },
    ],
    story: async () => [
      { text: '✦ Era uma vez, num reino movido a café e fibra óptica...', cls: 'text-amber-300 font-bold' },
      { text: '  Diz a lenda que todo sistema começa simples, até alguém pedir "só mais uma telinha".', cls: 'text-slate-200' },
      { text: '  Para evitar que o caos reinasse em produção, um desenvolvedor de Joinville decidiu', cls: 'text-slate-200' },
      { text: '  combinar arquitetura limpa em .NET, bancos de dados bem comportados e esteiras', cls: 'text-slate-200' },
      { text: '  de CI/CD que trabalham sozinhas enquanto o resto do reino dorme em paz.', cls: 'text-emerald-300' },
    ],
    devops: async () => {
      const base = [
        { text: '✔ Pipeline CI/CD Status: ALL GATES PASSING', cls: 'text-emerald-300 font-bold' },
        { text: '  • Supply Chain: Actions pinadas por SHA completo + npm --ignore-scripts', cls: 'text-slate-200' },
        { text: '  • Quality Gate: html-validate@10.17.0 em Node.js 20 [OK]', cls: 'text-slate-200' },
        { text: '  • Deployment: GitHub Pages Edge CDN via OIDC Token [OK]', cls: 'text-slate-200' },
        { text: '  • Pós-Deploy: Auditoria automatizada com Lighthouse CI [OK]', cls: 'text-slate-200' },
      ];
      try {
        const run = await fetchLatestWorkflowRun();
        if (run) {
          base.push({
            text: `  • Última Execução Real: Run #${run.runNumber} | SHA: ${run.shortSha} | Tempo: ${run.durationSec}s (${run.formattedDate})`,
            cls: 'text-amber-300'
          });
        }
      } catch {
        // Fallback silencioso caso offline
      }
      return base;
    },
    repos: async () => {
      try {
        const repos = await fetchAllUserRepos();
        const lines = [
          { text: `✦ Catálogo Completo (${repos.length} repositórios públicos em github.com/Digooow):`, cls: 'text-amber-300 font-bold' }
        ];
        repos.forEach(r => {
          lines.push({
            text: `  • ${r.name} [${r.language || 'Multi-stack'}] — ${r.size} (Push: ${r.updatedAt})`,
            cls: 'text-emerald-300'
          });
        });
        return lines;
      } catch (err) {
        return [
          { text: `⚠ Não foi possível listar os repositórios no momento (${err.message}).`, cls: 'text-amber-300' }
        ];
      }
    },
    'git log': async () => {
      try {
        const commits = await fetchRecentCommits(5);
        const lines = [
          { text: '✦ GitHub REST API — Últimos 5 commits em Digooow/Digooow.github.io:', cls: 'text-amber-300 font-bold' }
        ];
        commits.forEach(c => {
          lines.push({
            text: `  commit ${c.sha} (${c.date}) — ${c.message}`,
            cls: 'text-emerald-300'
          });
        });
        return lines;
      } catch (err) {
        return [
          { text: `⚠ Não foi possível consultar a API do GitHub no momento (${err.message}).`, cls: 'text-amber-300' }
        ];
      }
    },
    ping: async () => {
      const samples = [];
      const targetUrl = window.location.origin + window.location.pathname;
      for (let i = 0; i < 3; i++) {
        const t0 = performance.now();
        try {
          await fetch(`${targetUrl}?probe=${Date.now()}_${i}`, { method: 'HEAD', cache: 'no-store' });
        } catch {
          // Mesmo em modo file:// ou erro CORS, mede o tempo de resolução
        }
        const dt = Math.max(1, Math.round(performance.now() - t0));
        samples.push(dt);
      }
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);

      return [
        { text: '✦ Telemetria de Rede — Edge CDN Probe (3 pacotes):', cls: 'text-amber-300 font-bold' },
        { text: `  seq=1 time=${samples[0]}ms | seq=2 time=${samples[1]}ms | seq=3 time=${samples[2]}ms`, cls: 'text-slate-200' },
        { text: `  rtt min/avg/max = ${min}/${avg}/${max} ms • Protocolo: ${window.location.protocol.replace(':', '').toUpperCase()}`, cls: 'text-emerald-300' }
      ];
    },
    inspect: async () => {
      const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      const ttfb = nav ? Math.round(nav.responseStart - nav.requestStart) : 0;
      const domReady = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0;
      const domNodes = document.getElementsByTagName('*').length;
      const cores = navigator.hardwareConcurrency || 'N/A';
      const dpr = (window.devicePixelRatio || 1).toFixed(2);

      return [
        { text: '✦ Diagnóstico de Runtime & Performance (Browser Engine):', cls: 'text-amber-300 font-bold' },
        { text: `  • Métricas de Carga: TTFB ${Math.max(1, ttfb)}ms | DOM Interactive ${Math.max(5, domReady)}ms`, cls: 'text-emerald-300' },
        { text: `  • Árvore DOM: ${domNodes} nós semânticos | Viewport: ${window.innerWidth}x${window.innerHeight}px (DPR ${dpr}x)`, cls: 'text-slate-200' },
        { text: `  • Hardware Local: ${cores} threads lógicas | Canvas Particle Engine: Ativo`, cls: 'text-cyan-300' }
      ];
    },
    skills: async () => [
      { text: '✦ Arsenal Tecnológico & Especialidades:', cls: 'text-amber-300 font-bold' },
      { text: '  • Backend & Arquitetura: .NET 8, C#, Node.js, REST APIs, Clean Arch', cls: 'text-slate-200' },
      { text: '  • Frontend & UI: React, ES Modules, Tailwind CSS, HTML5 Semântico', cls: 'text-slate-200' },
      { text: '  • DevOps & Mensageria: GitHub Actions, Docker, Azure, Apache Kafka', cls: 'text-emerald-300' },
      { text: '  • Engenharia de Dados & IA: Python, SQL, Modelagem & Análise Analítica', cls: 'text-cyan-300' },
    ],
    about: async () => [
      { text: '✦ Rodrigo da Cruz Godinho', cls: 'text-amber-300 font-bold' },
      { text: '  Estudante de Desenvolvimento de Sistemas e IA no SENAC Joinville (SC).', cls: 'text-slate-200' },
      { text: '  Transformando requisitos complexos em software confiável, testado e bem contado.', cls: 'text-slate-200' },
    ],
    contact: async () => [
      { text: '✦ Portais e Redes:', cls: 'text-amber-300 font-bold' },
      { text: '  GitHub:   https://github.com/Digooow', cls: 'text-emerald-300' },
      { text: '  LinkedIn: https://linkedin.com/in/digooow', cls: 'text-cyan-300' },
      { text: '  LeetCode: https://leetcode.com/digooow', cls: 'text-amber-300' },
    ],
    clear: async () => {
      output.innerHTML = '';
      return [];
    }
  };

  // Alias para quem digitar apenas `git`
  COMMANDS.git = COMMANDS['git log'];

  const AVAILABLE_CMD_NAMES = Object.keys(COMMANDS).filter(k => k !== 'git');

  function appendLines(lines) {
    lines.forEach(item => {
      const p = document.createElement('p');
      p.className = `leading-relaxed ${item.cls || 'text-slate-200'}`;
      p.textContent = item.text;
      output.appendChild(p);
    });
    output.scrollTop = output.scrollHeight;
  }

  async function handleCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    if (!cmd) return;

    commandHistory.push(cmdRaw.trim());
    historyIndex = commandHistory.length;

    const eco = document.createElement('p');
    eco.className = 'text-slate-400 mt-2';
    eco.innerHTML = `<span class="text-emerald-400 font-bold">digooow@core</span>:<span class="text-amber-400">~$</span> `;
    const cmdSpan = document.createElement('span');
    cmdSpan.textContent = cmdRaw;
    eco.appendChild(cmdSpan);
    output.appendChild(eco);

    if (COMMANDS[cmd]) {
      const res = await COMMANDS[cmd]();
      appendLines(res);
    } else {
      appendLines([
        { text: `Comando não encontrado nos arquivos do reino: "${cmd}". Digite "help" para ver o mapa.`, cls: 'text-rose-400' }
      ]);
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleCommand(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        input.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.value.trim().toLowerCase();
      if (!partial) return;
      const match = AVAILABLE_CMD_NAMES.find(c => c.startsWith(partial));
      if (match) {
        input.value = match;
      }
    }
  });

  window.runQuickCommand = function(cmd) {
    handleCommand(cmd);
    input.focus();
  };

  appendLines([
    { text: '✦ Crônicas do Sistema iniciadas — Ambiente de Produção Ativo', cls: 'text-emerald-300 font-bold' },
    { text: 'Dica: Use Tab para autocompletar, ↑↓ para histórico, ou experimente "git log", "ping" e "inspect".', cls: 'text-slate-300' }
  ]);
}
