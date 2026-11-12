/* ==========================================================================
   GITHUB TELEMETRY — Integração Completa com a GitHub REST API v3
   Sincroniza Workflows, Todos os Repositórios Públicos e Múltiplas Linguagens
   ========================================================================== */

'use strict';

const REPO_OWNER = 'Digooow';
const PAGES_REPO = 'Digooow.github.io';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos em localStorage para economizar rate-limit

const LANGUAGE_COLORS = {
  'C#': '#178600',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python': '#3572A5',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Jupyter Notebook': '#DA5B0B',
  'SQL': '#e38c00',
  'Shell': '#89e051',
  'Dockerfile': '#384d54',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'Go': '#00ADD8'
};

// Descrições narrativas amigáveis caso um repositório no GitHub esteja sem descrição preenchida
const FALLBACK_NARRATIVES = {
  'digooow.github.io': {
    title: 'O Próprio Reino (Portfólio & CI/CD)',
    badge: 'DevOps & Front-End',
    icon: 'fa-solid fa-wand-magic-sparkles',
    desc: 'A estrutura viva que você está navegando agora: animações em Canvas 2D, consumo assíncrono da API do GitHub e entrega contínua com Quality Gates e auditoria Lighthouse CI.',
    extraTags: ['HTML5', 'Tailwind CSS', 'ES Modules', 'GitHub Actions']
  },
  'digooow': {
    title: 'O Pergaminho de Apresentação (Profile)',
    badge: 'Config & Docs',
    icon: 'fa-solid fa-scroll',
    desc: 'Repositório especial que dá boas-vindas a quem visita o perfil principal no GitHub, reunindo estatísticas, stack tecnológica e atalhos da jornada.',
    extraTags: ['Markdown', 'GitHub Profile', 'Documentação']
  }
};

function getCachedData(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch {
    // Ignora caso localStorage esteja bloqueado
  }
}

function formatDateBR(isoString) {
  if (!isoString) return 'Recente';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recente';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatSize(sizeKb) {
  if (!sizeKb || sizeKb <= 0) return 'Código leve';
  if (sizeKb >= 1024) {
    return `${(sizeKb / 1024).toFixed(1)} MB`;
  }
  return `${sizeKb} KB`;
}

function humanizeRepoName(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Busca todas as linguagens de programação de um repositório (endpoint /languages)
 * e calcula a porcentagem de cada uma.
 */
export async function fetchRepoLanguages(repoName, fallbackLang) {
  const cacheKey = `gh_repo_langs_${repoName.toLowerCase()}_v2`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${repoName}/languages`;
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const bytesMap = await response.json();
    const entries = Object.entries(bytesMap);
    if (!entries.length) {
      const single = fallbackLang ? [{ name: fallbackLang, pct: 100, color: LANGUAGE_COLORS[fallbackLang] || '#10b981' }] : [];
      setCachedData(cacheKey, single);
      return single;
    }

    const totalBytes = entries.reduce((acc, [, bytes]) => acc + bytes, 0);
    const breakdown = entries
      .sort((a, b) => b[1] - a[1])
      .map(([lang, bytes]) => {
        const rawPct = (bytes / totalBytes) * 100;
        const pct = rawPct < 1 ? '<1' : Math.round(rawPct);
        return {
          name: lang,
          pct,
          numericPct: Math.max(2, Math.round(rawPct)),
          color: LANGUAGE_COLORS[lang] || '#10b981'
        };
      });

    setCachedData(cacheKey, breakdown);
    return breakdown;
  } catch {
    return fallbackLang
      ? [{ name: fallbackLang, pct: 100, numericPct: 100, color: LANGUAGE_COLORS[fallbackLang] || '#10b981' }]
      : [];
  }
}

/**
 * Busca a última execução do GitHub Actions para alimentar a Pipeline e o Terminal
 */
export async function fetchLatestWorkflowRun() {
  const cacheKey = 'gh_pages_latest_run_v2';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const url = `https://api.github.com/repos/${REPO_OWNER}/${PAGES_REPO}/actions/runs?per_page=1`;
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (!response.ok) {
    throw new Error(`GitHub API HTTP ${response.status}`);
  }

  const json = await response.json();
  const run = json.workflow_runs && json.workflow_runs[0];
  if (!run) return null;

  const started = new Date(run.run_started_at || run.created_at).getTime();
  const updated = new Date(run.updated_at || run.created_at).getTime();
  const durationSec = Math.max(12, Math.round((updated - started) / 1000));

  const summary = {
    runNumber: run.run_number,
    status: run.status,
    conclusion: run.conclusion || 'success',
    shortSha: (run.head_sha || '').slice(0, 7),
    commitMsg: (run.display_title || 'Deploy automático').slice(0, 60),
    durationSec,
    updatedAt: run.updated_at,
    formattedDate: formatDateBR(run.updated_at),
    htmlUrl: run.html_url || `https://github.com/${REPO_OWNER}/${PAGES_REPO}/actions`
  };

  setCachedData(cacheKey, summary);
  return summary;
}

/**
 * Busca os últimos commits reais do repositório para o comando `git log`
 */
export async function fetchRecentCommits(limit = 5) {
  const cacheKey = `gh_pages_commits_${limit}_v2`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const url = `https://api.github.com/repos/${REPO_OWNER}/${PAGES_REPO}/commits?per_page=${limit}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (!response.ok) {
    throw new Error(`GitHub API HTTP ${response.status}`);
  }

  const commits = await response.json();
  const mapped = commits.map(c => ({
    sha: (c.sha || '').slice(0, 7),
    author: (c.commit && c.commit.author && c.commit.author.name) || REPO_OWNER,
    date: formatDateBR(c.commit && c.commit.author && c.commit.author.date),
    message: ((c.commit && c.commit.message) || '').split('\n')[0].slice(0, 68)
  }));

  setCachedData(cacheKey, mapped);
  return mapped;
}

/**
 * Busca todos os repositórios públicos do usuário no GitHub
 */
export async function fetchAllUserRepos() {
  const cacheKey = 'gh_user_repos_list_v2';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const url = `https://api.github.com/users/${REPO_OWNER}/repos?per_page=100&sort=updated`;
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (!response.ok) {
    throw new Error(`GitHub API HTTP ${response.status}`);
  }

  const repos = await response.json();
  const list = repos
    .filter(r => !r.fork)
    .map(r => ({
      name: r.name,
      lowerName: r.name.toLowerCase(),
      description: r.description || '',
      htmlUrl: r.html_url,
      homepage: r.homepage || '',
      language: r.language || '',
      topics: Array.isArray(r.topics) ? r.topics : [],
      size: formatSize(r.size),
      stars: r.stargazers_count || 0,
      updatedAt: formatDateBR(r.pushed_at || r.updated_at),
      pushedAtRaw: r.pushed_at || r.updated_at,
      defaultBranch: r.default_branch || 'main'
    }));

  setCachedData(cacheKey, list);
  return list;
}

/**
 * Renderiza as badges de múltiplas linguagens + barra de proporção em um card
 */
function hydrateCardWithLanguages(card, repoMeta, langBreakdown) {
  // 1. Adicionar novas linguagens detectadas pela API nas badges do card (sem apagar as tags conceituais existentes)
  const badgesContainer = card.querySelector('.repo-badges');
  if (badgesContainer && langBreakdown.length > 0) {
    const existingBadges = new Set(
      Array.from(badgesContainer.querySelectorAll('.badge-tag')).map(el => el.textContent.trim().toLowerCase())
    );

    langBreakdown.forEach(item => {
      if (!existingBadges.has(item.name.toLowerCase())) {
        const span = document.createElement('span');
        span.className = 'badge-tag';
        span.textContent = item.name;
        badgesContainer.appendChild(span);
        existingBadges.add(item.name.toLowerCase());
      }
    });
  }

  // 2. Atualizar o rodapé de telemetria com todas as linguagens e barra multicolorida
  const slot = card.querySelector('.repo-telemetry');
  if (!slot) return;

  const langsHtml = langBreakdown.length > 0
    ? langBreakdown
        .map(l => `
          <span class="inline-flex items-center gap-1 text-slate-200">
            <span class="w-2 h-2 rounded-full" style="background-color: ${l.color}"></span>
            <span>${l.name}</span>
            <span class="text-slate-400">${l.pct}%</span>
          </span>
        `)
        .join('<span class="text-slate-600">•</span>')
    : `<span class="text-emerald-300">${repoMeta.language || 'Multi-stack'}</span>`;

  const progressSegments = langBreakdown.length > 0
    ? `<div class="w-full h-1.5 rounded-full bg-black/50 overflow-hidden flex mb-2" role="img" aria-label="Proporção de linguagens do repositório">
        ${langBreakdown.map(l => `<div style="width: ${l.numericPct}%; background-color: ${l.color}" title="${l.name}: ${l.pct}%"></div>`).join('')}
       </div>`
    : '';

  slot.innerHTML = `
    <div class="w-full">
      ${progressSegments}
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        ${langsHtml}
        <span class="text-slate-500">•</span>
        <span class="text-slate-400">${repoMeta.size}</span>
        <span class="text-slate-500">•</span>
        <span class="text-amber-200/80">Push: ${repoMeta.updatedAt}</span>
      </div>
    </div>
  `;
}

/**
 * Cria um card dinâmico para qualquer repositório público adicional que não estava fixo no HTML
 */
function createDynamicRepoCard(repoMeta) {
  const custom = FALLBACK_NARRATIVES[repoMeta.lowerName];
  const title = custom ? custom.title : humanizeRepoName(repoMeta.name);
  const badgeText = custom ? custom.badge : (repoMeta.language || 'Repositório');
  const iconClass = custom ? custom.icon : 'fa-solid fa-code-branch';
  const description = repoMeta.description || (custom
    ? custom.desc
    : `Missão registrada nos arquivos do GitHub: código-fonte, experimentos práticos e evolução contínua no repositório ${repoMeta.name}.`);

  const initialTags = [];
  if (repoMeta.language) initialTags.push(repoMeta.language);
  if (custom && custom.extraTags) {
    custom.extraTags.forEach(t => {
      if (!initialTags.includes(t)) initialTags.push(t);
    });
  }
  if (repoMeta.topics && repoMeta.topics.length) {
    repoMeta.topics.slice(0, 3).forEach(t => {
      if (!initialTags.includes(t)) initialTags.push(t);
    });
  }

  const card = document.createElement('div');
  card.setAttribute('data-repo', repoMeta.name);
  card.className = 'md:col-span-1 lg:col-span-2 kama-card p-6 rounded-2xl flex flex-col justify-between group';

  card.innerHTML = `
    <div>
      <div class="flex justify-between items-start mb-4">
        <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300 text-xl group-hover:scale-110 transition-transform">
          <i class="${iconClass}"></i>
        </div>
        <span class="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/60 border border-emerald-400/30 text-emerald-300">
          ${badgeText}
        </span>
      </div>
      <h3 class="font-cinzel font-bold text-lg text-white group-hover:text-amber-200 transition-colors mb-2">
        ${title}
      </h3>
      <p class="text-slate-300 text-xs leading-relaxed mb-4">
        ${description}
      </p>
      <div class="repo-badges flex flex-wrap gap-1.5 mb-4">
        ${initialTags.map(tag => `<span class="badge-tag">${tag}</span>`).join('')}
      </div>
    </div>
    <div class="pt-3 border-t border-emerald-500/15 flex flex-col gap-2.5">
      <div class="repo-telemetry flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
        <span class="text-emerald-300">${repoMeta.language || 'Código'}</span>
        <span>•</span>
        <span>${repoMeta.size}</span>
      </div>
      <a href="${repoMeta.htmlUrl}" target="_blank" rel="noopener noreferrer" class="card-action-link text-xs">
        <span>Acessar Repositório (${repoMeta.name})</span>
        <i class="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1.5"></i>
      </a>
    </div>
  `;

  return card;
}

/**
 * Inicializa toda a telemetria do GitHub na página
 */
export async function initGitHubTelemetry() {
  // 1. Hidratar telemetria da Pipeline e Navbar
  try {
    const run = await fetchLatestWorkflowRun();
    if (run) {
      const shaEl = document.getElementById('pipeline-live-sha');
      const statusEl = document.getElementById('pipeline-live-status');
      const timeEl = document.getElementById('pipeline-live-time');
      const linkEl = document.getElementById('pipeline-live-link');
      const navBadgeEl = document.getElementById('nav-ci-text');

      if (shaEl && run.shortSha) {
        shaEl.textContent = `Run #${run.runNumber} • commit ${run.shortSha}`;
      }
      if (timeEl) {
        timeEl.textContent = `${run.durationSec}s • ${run.formattedDate}`;
      }
      if (statusEl) {
        const isOk = run.conclusion === 'success' || run.status === 'in_progress';
        statusEl.innerHTML = isOk
          ? '<i class="fa-solid fa-circle-check"></i> Quality Gate &amp; Deploy: Verified'
          : '<i class="fa-solid fa-circle-info"></i> Status: ' + run.conclusion;
      }
      if (linkEl && run.htmlUrl) {
        linkEl.href = run.htmlUrl;
      }
      if (navBadgeEl && run.shortSha) {
        navBadgeEl.textContent = `Build #${run.runNumber} (${run.shortSha}) • OK`;
      }
    }
  } catch {
    // Mantém fallback estático se offline
  }

  // 2. Sincronizar TODOS os repositórios públicos e todas as linguagens de cada um
  try {
    const allRepos = await fetchAllUserRepos();
    const repoMap = {};
    allRepos.forEach(r => {
      repoMap[r.lowerName] = r;
    });

    // Atualiza contador total de repositórios na seção, se existir
    const countBadge = document.getElementById('repos-total-count');
    if (countBadge && allRepos.length > 0) {
      countBadge.textContent = `${allRepos.length} Repositórios Públicos Sincronizados`;
    }

    const grid = document.getElementById('bento-repos-grid');
    const existingCards = Array.from(document.querySelectorAll('[data-repo]'));
    const renderedRepoNames = new Set(
      existingCards.map(c => (c.getAttribute('data-repo') || '').toLowerCase())
    );

    // Adiciona dinamicamente qualquer repositório público do GitHub que ainda não tenha card próprio
    if (grid) {
      allRepos.forEach(repoMeta => {
        if (!renderedRepoNames.has(repoMeta.lowerName)) {
          const newCard = createDynamicRepoCard(repoMeta);
          grid.appendChild(newCard);
          existingCards.push(newCard);
          renderedRepoNames.add(repoMeta.lowerName);
        }
      });
    }

    // Para cada card (fixo ou dinâmico), busca o detalhamento de TODAS as linguagens via /languages
    await Promise.allSettled(
      existingCards.map(async (card) => {
        const repoAttr = (card.getAttribute('data-repo') || '').toLowerCase();
        const meta = repoMap[repoAttr];
        if (!meta) return;

        const langBreakdown = await fetchRepoLanguages(meta.name, meta.language);
        hydrateCardWithLanguages(card, meta, langBreakdown);
      })
    );
  } catch {
    // Mantém os cards estáticos caso a API esteja inacessível
  }
}
