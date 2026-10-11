/* ==========================================================================
   TERMINAL CLI & PIPELINE
   ========================================================================== */

'use strict';

export function initTerminalAndPipeline() {
  window.selectPipelineStep = function(stepNum) {
    const stepsData = {
      1: { name: '01 - Git Push (Disparo)', details: 'Push detectado na branch main -> GitHub Actions inicializa o workflow de deploy automático.', log: '[event] push to refs/heads/main | sha: 8b495ca | runner: ubuntu-latest' },
      2: { name: '02 - Quality Gate', details: 'Executa checagem de integridade HTML e linters semânticos (cycjimmy/html-check-action@v2).', log: '[check] HTML syntax & tags validation passed. 0 errors, 0 warnings.' },
      3: { name: '03 - Artifact Build', details: 'Empacota arquivos estáticos via actions/upload-pages-artifact@v3.', log: '[artifact] Built bundle uploaded successfully. Ready for deployment.' },
      4: { name: '04 - Deploy to Pages', details: 'Implantação global nos servidores de borda do GitHub Pages via actions/deploy-pages@v4.', log: '[deploy] Live at https://digooow.github.io/ with HTTPS certificate active.' },
      5: { name: '05 - Lighthouse Audit', details: 'Auditoria de ponta a ponta avaliando performance, acessibilidade e SEO pós-publicação.', log: '[audit] Lighthouse Score: Performance: 100 | Accessibility: 100 | SEO: 100.' }
    };

    const info = stepsData[stepNum];
    if (!info) return;

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

      const termSec = document.getElementById('terminal');
      if (termSec) {
        termSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

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

  appendLines([
    { text: '✦ Sessão inicializada no Nó Kamasylve-1 [Kamasylvia Realm]', cls: 'text-emerald-300 font-bold' },
    { text: 'Digite "help" ou selecione um atalho para explorar a infraestrutura.', cls: 'text-slate-300' }
  ]);
}