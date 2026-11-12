/* ==========================================================================
   GITHUB TELEMETRY — Integração Completa com a GitHub REST API v3
   Sincroniza Workflows, Todos os Repositórios Públicos (incluindo Forks) e Linguagens
   ========================================================================== */

'use strict';

const REPO_OWNER = 'Digooow';
const PAGES_REPO = 'Digooow.github.io';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos para lista de repos/workflows
const LANG_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas quando pushed_at não mudou

let apiRateLimited = false;

const LANGUAGE_COLORS = {
  'C#': '#178600',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python': '#3572A5',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'SCSS': '#c6538c',
  'Jupyter Notebook': '#DA5B0B',
  'SQL': '#e38c00',
  'TSQL': '#e38c00',
  'PLpgSQL': '#336790',
  'Shell': '#89e051',
  'PowerShell': '#012456',
  'Batchfile': '#C1F12E',
  'Dockerfile': '#384d54',
  'Java': '#b07219',
  'Kotlin': '#A97BFF',
  'C++': '#f34b7d',
  'C': '#555555',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Dart': '#00B4AB',
  'Swift': '#F05138',
  'Vue': '#41b883',
  'Svelte': '#ff3e00',
  'Makefile': '#427819',
  'Lua': '#000080'
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCacheEntry(key, { allowStale = false, ttlMs = CACHE_TTL_MS } = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const isExpired = Date.now() - parsed.timestamp > ttlMs;
    if (isExpired && !allowStale) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getCachedData(key, options = {}) {
  const entry = getCacheEntry(key, options);
  return entry ? entry.data : null;
}

function setCachedData(key, data, extra = {}) {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data,
      ...extra
    }));
  } catch {
    // Ignora caso localStorage esteja bloqueado
  }
}

function checkRateLimit(response) {
  if (response.status === 403 || response.status === 429) {
    apiRateLimited = true;
  }
  const remaining = response.headers.get('X-RateLimit-Remaining');
  if (remaining === '0') {
    apiRateLimited = true;
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

function buildSingleLanguageFallback(fallbackLang) {
  if (!fallbackLang) return [];
  return [{
    name: fallbackLang,
    pct: 100,
    numericPct: 100,
    color: LANGUAGE_COLORS[fallbackLang] || '#10b981'
  }];
}

/**
 * Busca todas as linguagens de programação de um repositório (endpoint /languages)
 * usando cache inteligente vinculado ao pushed_at para economizar requisições.
 */
export async function fetchRepoLanguages(repoName, fallbackLang, pushedAt = '') {
  const cacheKey = `gh_repo_langs_${repoName.toLowerCase()}_v3`;
  const cachedEntry = getCacheEntry(cacheKey, { ttlMs: LANG_CACHE_TTL_MS });
  if (cachedEntry && (!pushedAt || cachedEntry.pushedAt === pushedAt)) {
    return cachedEntry.data;
  }

  if (apiRateLimited) {
    return cachedEntry ? cachedEntry.data : buildSingleLanguageFallback(fallbackLang);
  }

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${encodeURIComponent(repoName)}/languages`;
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    checkRateLimit(response);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const bytesMap = await response.json();
    const entries = Object.entries(bytesMap);
    if (!entries.length) {
      const single = buildSingleLanguageFallback(fallbackLang);
      setCachedData(cacheKey, single, { pushedAt });
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

    setCachedData(cacheKey, breakdown, { pushedAt });
    return breakdown;
  } catch {
    const staleEntry = getCacheEntry(cacheKey, { allowStale: true });
    if (staleEntry && Array.isArray(staleEntry.data) && staleEntry.data.length > 0) {
      return staleEntry.data;
    }
    return buildSingleLanguageFallback(fallbackLang);
  }
}

/**
 * Busca a última execução do GitHub Actions para alimentar a Pipeline e o Terminal
 */
export async function fetchLatestWorkflowRun() {
  const cacheKey = 'gh_pages_latest_run_v3';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${PAGES_REPO}/actions/runs?per_page=1`;
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    checkRateLimit(response);

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
  } catch (err) {
    const stale = getCachedData(cacheKey, { allowStale: true });
    if (stale) return stale;
    throw err;
  }
}

/**
 * Busca os últimos commits reais do repositório para o comando `git log`
 */
export async function fetchRecentCommits(limit = 5) {
  const cacheKey = `gh_pages_commits_${limit}_v3`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${PAGES_REPO}/commits?per_page=${limit}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    checkRateLimit(response);

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
  } catch (err) {
    const stale = getCachedData(cacheKey, { allowStale: true });
    if (stale) return stale;
    throw err;
  }
}

/**
 * Busca todos os repositórios públicos do usuário no GitHub (incluindo forks),
 * com suporte a paginação e fallback para cache em caso de rate-limit.
 */
export async function fetchAllUserRepos() {
  const cacheKey = 'gh_user_repos_list_v3';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const allRaw = [];
    const maxPages = 5;

    for (let page = 1; page <= maxPages; page++) {
      const url = `https://api.github.com/users/${REPO_OWNER}/repos?type=owner&per_page=100&sort=updated&page=${page}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      checkRateLimit(response);

      if (!response.ok) {
        throw new Error(`GitHub API HTTP ${response.status}`);
      }

      const batch = await response.json();
      if (!Array.isArray(batch) || batch.length === 0) break;

      allRaw.push(...batch);
      if (batch.length < 100) break;
    }

    const list = allRaw.map(r => ({
      name: r.name,
      lowerName: r.name.toLowerCase(),
      description: r.description || '',
      htmlUrl: r.html_url,
      homepage: r.homepage || '',
      language: r.language || '',
      topics: Array.isArray(r.topics) ? r.topics : [],
      size: formatSize(r.size),
      stars: r.stargazers_count || 0,
      forksCount: r.forks_count || 0,
      isFork: Boolean(r.fork),
      archived: Boolean(r.archived),
      updatedAt: formatDateBR(r.pushed_at || r.updated_at),
      pushedAtRaw: r.pushed_at || r.updated_at || '',
      defaultBranch: r.default_branch || 'main'
    }));

    setCachedData(cacheKey, list);
    return list;
  } catch (err) {
    const stale = getCachedData(cacheKey, { allowStale: true });
    if (stale) return stale;
    throw err;
  }
}

/**
 * Renderiza as badges de múltiplas linguagens + barra de proporção em um card
 */
function hydrateCardWithLanguages(card, repoMeta, langBreakdown) {
  card.setAttribute('data-repo-type', repoMeta.isFork ? 'fork' : 'source');

  // 1. Adicionar linguagens detectadas pela API nas badges do card (sem duplicar as existentes)
  const badgesContainer = card.querySelector('.repo-badges');
  if (badgesContainer && langBreakdown.length > 0) {
    const existingBadges = new Set(
      Array.from(badgesContainer.querySelectorAll('.badge-tag')).map(el => el.textContent.trim().toLowerCase())
    );

    langBreakdown.slice(0, 6).forEach(item => {
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

  const visibleLangs = langBreakdown.slice(0, 6);
  const hiddenCount = Math.max(0, langBreakdown.length - visibleLangs.length);

  const langsHtml = visibleLangs.length > 0
    ? visibleLangs
        .map(l => `
          <span class="inline-flex items-center gap-1 text-slate-200">
            <span class="w-2 h-2 rounded-full" style="background-color: ${escapeHtml(l.color)}"></span>
            <span>${escapeHtml(l.name)}</span>
            <span class="text-slate-400">${escapeHtml(l.pct)}%</span>
          </span>
        `)
        .join('<span class="text-slate-600">•</span>')
        + (hiddenCount > 0 ? `<span class="text-slate-400">+${hiddenCount}</span>` : '')
    : `<span class="text-emerald-300">${escapeHtml(repoMeta.language || 'Multi-stack')}</span>`;

  const progressSegments = langBreakdown.length > 0
    ? `<div class="w-full h-1.5 rounded-full bg-black/50 overflow-hidden flex mb-2" role="img" aria-label="Proporção de linguagens do repositório">
        ${langBreakdown.map(l => `<div style="width: ${Number(l.numericPct) || 2}%; background-color: ${escapeHtml(l.color)}" title="${escapeHtml(l.name)}: ${escapeHtml(l.pct)}%"></div>`).join('')}
       </div>`
    : '';

  const forkMetaTag = repoMeta.isFork
    ? `<span class="text-amber-300/90 inline-flex items-center gap-1"><i class="fa-solid fa-code-fork text-[10px]" aria-hidden="true"></i> Fork</span><span class="text-slate-500">•</span>`
    : '';

  slot.innerHTML = `
    <div class="w-full">
      ${progressSegments}
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        ${forkMetaTag}
        ${langsHtml}
        <span class="text-slate-500">•</span>
        <span class="text-slate-400">${escapeHtml(repoMeta.size)}</span>
        <span class="text-slate-500">•</span>
        <span class="text-amber-200/80">Push: ${escapeHtml(repoMeta.updatedAt)}</span>
      </div>
    </div>
  `;
}

/**
 * Cria um card dinâmico para qualquer repositório público adicional (incluindo Forks)
 */
function createDynamicRepoCard(repoMeta) {
  const custom = FALLBACK_NARRATIVES[repoMeta.lowerName];
  const title = custom ? custom.title : humanizeRepoName(repoMeta.name);
  const isFork = Boolean(repoMeta.isFork);

  const iconClass = custom
    ? custom.icon
    : (isFork ? 'fa-solid fa-code-fork' : 'fa-solid fa-code-branch');

  const iconContainerClass = isFork
    ? 'bg-amber-500/15 border-amber-300/35 text-amber-300'
    : 'bg-emerald-500/20 border-emerald-300/30 text-emerald-300';

  const badgeText = custom
    ? custom.badge
    : (isFork ? 'Fork' : (repoMeta.language || 'Repositório'));

  const badgeClass = isFork
    ? 'bg-amber-950/60 border-amber-400/35 text-amber-300'
    : 'bg-emerald-950/60 border-emerald-400/30 text-emerald-300';

  const fallbackDesc = isFork
    ? `Repositório bifurcado (fork) explorado para estudo de arquitetura, testes e contribuição no ecossistema de ${repoMeta.name}.`
    : `Missão registrada nos arquivos do GitHub: código-fonte, experimentos práticos e evolução contínua no repositório ${repoMeta.name}.`;

  const description = repoMeta.description || (custom ? custom.desc : fallbackDesc);

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
  card.setAttribute('data-repo-type', isFork ? 'fork' : 'source');
  card.className = 'md:col-span-1 lg:col-span-2 kama-card p-6 rounded-2xl flex flex-col justify-between group';

  const forkBadgePrefix = isFork ? '<i class="fa-solid fa-code-fork text-[10px]" aria-hidden="true"></i> ' : '';

  card.innerHTML = `
    <div>
      <div class="flex justify-between items-start gap-2 mb-4">
        <div class="w-10 h-10 rounded-lg border flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${iconContainerClass}">
          <i class="${escapeHtml(iconClass)}" aria-hidden="true"></i>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1.5">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border inline-flex items-center gap-1 ${badgeClass}">
            ${forkBadgePrefix}${escapeHtml(badgeText)}
          </span>
        </div>
      </div>
      <h3 class="font-cinzel font-bold text-lg text-white group-hover:text-amber-200 transition-colors mb-2">
        ${escapeHtml(title)}
      </h3>
      <p class="text-slate-300 text-xs leading-relaxed mb-4">
        ${escapeHtml(description)}
      </p>
      <div class="repo-badges flex flex-wrap gap-1.5 mb-4">
        ${initialTags.map(tag => `<span class="badge-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </div>
    <div class="pt-3 border-t border-emerald-500/15 flex flex-col gap-2.5">
      <div class="repo-telemetry flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
        <span class="${isFork ? 'text-amber-300' : 'text-emerald-300'}">${escapeHtml(repoMeta.language || 'Multi-stack')}</span>
        <span>•</span>
        <span>${escapeHtml(repoMeta.size)}</span>
      </div>
      <a href="${escapeHtml(repoMeta.htmlUrl)}" target="_blank" rel="noopener noreferrer" class="card-action-link text-xs">
        <span>${isFork ? 'Acessar Fork' : 'Acessar Repositório'} (${escapeHtml(repoMeta.name)})</span>
        <i class="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1.5" aria-hidden="true"></i>
      </a>
    </div>
  `;

  return card;
}

/**
 * Configura os filtros interativos (Todos / Autorais / Forks) e atualiza contadores
 */
function initRepoFilters(cards) {
  const filterBar = document.getElementById('repo-filters');
  if (!filterBar || !cards.length) return;

  const totalCount = cards.length;
  const forkCount = cards.filter(c => c.getAttribute('data-repo-type') === 'fork').length;
  const sourceCount = totalCount - forkCount;

  const allEl = document.getElementById('filter-count-all');
  const sourceEl = document.getElementById('filter-count-source');
  const forkEl = document.getElementById('filter-count-fork');

  if (allEl) allEl.textContent = `(${totalCount})`;
  if (sourceEl) sourceEl.textContent = `(${sourceCount})`;
  if (forkEl) forkEl.textContent = `(${forkCount})`;

  filterBar.classList.remove('hidden');
  filterBar.classList.add('flex');

  const buttons = Array.from(filterBar.querySelectorAll('button[data-filter]'));
  const emptyState = document.getElementById('repos-empty-state');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-filter');

      buttons.forEach(b => {
        const isSelected = b === btn;
        b.classList.toggle('active', isSelected);
        b.setAttribute('aria-pressed', String(isSelected));
      });

      let visible = 0;
      cards.forEach(card => {
        const type = card.getAttribute('data-repo-type') || 'source';
        const show = target === 'all' || type === target;
        card.classList.toggle('hidden', !show);
        if (show) visible++;
      });

      if (emptyState) {
        emptyState.classList.toggle('hidden', visible > 0);
      }
    });
  });
}

/**
 * Processa a hidratação das linguagens em lotes pequenos para respeitar o rate-limit do GitHub
 */
async function hydrateAllCardsInBatches(cards, repoMap, batchSize = 4) {
  for (let i = 0; i < cards.length; i += batchSize) {
    const chunk = cards.slice(i, i + batchSize);
    await Promise.allSettled(
      chunk.map(async (card) => {
        const repoAttr = (card.getAttribute('data-repo') || '').toLowerCase();
        const meta = repoMap[repoAttr];
        if (!meta) return;

        const langBreakdown = await fetchRepoLanguages(meta.name, meta.language, meta.pushedAtRaw);
        hydrateCardWithLanguages(card, meta, langBreakdown);
      })
    );
  }
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
          : `<i class="fa-solid fa-circle-info"></i> Status: ${escapeHtml(run.conclusion)}`;
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

  // 2. Sincronizar TODOS os repositórios públicos (incluindo Forks) e todas as linguagens
  try {
    const allRepos = await fetchAllUserRepos();
    const repoMap = {};
    allRepos.forEach(r => {
      repoMap[r.lowerName] = r;
    });

    const forkCount = allRepos.filter(r => r.isFork).length;
    const sourceCount = allRepos.length - forkCount;

    const countBadge = document.getElementById('repos-total-count');
    if (countBadge && allRepos.length > 0) {
      countBadge.textContent = forkCount > 0
        ? `${allRepos.length} Repositórios Públicos (${sourceCount} Autorais • ${forkCount} Forks)`
        : `${allRepos.length} Repositórios Públicos Sincronizados`;
    }

    const grid = document.getElementById('bento-repos-grid');
    const existingCards = Array.from(document.querySelectorAll('[data-repo]'));
    const renderedRepoNames = new Set(
      existingCards.map(c => (c.getAttribute('data-repo') || '').toLowerCase())
    );

    // Atualiza o atributo data-repo-type dos cards já presentes no HTML
    existingCards.forEach(card => {
      const repoAttr = (card.getAttribute('data-repo') || '').toLowerCase();
      const meta = repoMap[repoAttr];
      if (meta) {
        card.setAttribute('data-repo-type', meta.isFork ? 'fork' : 'source');
      }
    });

    // Ordena os repositórios ainda não renderizados: autorais primeiro e forks logo em seguida
    const pendingRepos = allRepos
      .filter(r => !renderedRepoNames.has(r.lowerName))
      .sort((a, b) => Number(a.isFork) - Number(b.isFork));

    if (grid) {
      pendingRepos.forEach(repoMeta => {
        const newCard = createDynamicRepoCard(repoMeta);
        grid.appendChild(newCard);
        existingCards.push(newCard);
        renderedRepoNames.add(repoMeta.lowerName);
      });
    }

    initRepoFilters(existingCards);

    // Hidrata todas as linguagens de cada card respeitando lotes de concorrência
    await hydrateAllCardsInBatches(existingCards, repoMap, 4);
  } catch {
    // Mantém os cards estáticos caso a API esteja inacessível
  }
}
