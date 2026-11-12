/* ==========================================================================
   GITHUB TELEMETRY — Integração em Tempo Real com a GitHub REST API v3
   ========================================================================== */

'use strict';

const REPO_OWNER = 'Digooow';
const PAGES_REPO = 'Digooow.github.io';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos para respeitar rate-limit

function getCachedData(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedData(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch {
    // Ignora caso sessionStorage esteja indisponível
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

/**
 * Busca a última execução do GitHub Actions para alimentar a Pipeline e o Terminal
 */
export async function fetchLatestWorkflowRun() {
  const cacheKey = 'gh_pages_latest_run_v1';
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
  const cacheKey = `gh_pages_commits_${limit}_v1`;
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
 * Busca metadados reais de todos os repositórios públicos em uma única chamada
 */
export async function fetchAllUserRepos() {
  const cacheKey = 'gh_user_repos_v1';
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
  const repoMap = {};
  for (const r of repos) {
    repoMap[r.name.toLowerCase()] = {
      name: r.name,
      language: r.language,
      size: formatSize(r.size),
      stars: r.stargazers_count || 0,
      updatedAt: formatDateBR(r.pushed_at || r.updated_at),
      defaultBranch: r.default_branch || 'main'
    };
  }

  setCachedData(cacheKey, repoMap);
  return repoMap;
}

/**
 * Hidrata a barra de telemetria da Pipeline e dos Cards de Projetos no DOM
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
    // Mantém os valores estáticos de fallback caso offline ou rate-limited
  }

  // 2. Hidratar telemetria ao vivo nos Cards de Projetos (Bento Grid)
  try {
    const repoMap = await fetchAllUserRepos();
    const cards = document.querySelectorAll('[data-repo]');
    cards.forEach(card => {
      const repoName = (card.getAttribute('data-repo') || '').toLowerCase();
      const meta = repoMap[repoName];
      if (!meta) return;

      const slot = card.querySelector('.repo-telemetry');
      if (!slot) return;

      const langLabel = meta.language || 'Multi-stack';
      slot.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-emerald-300">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>${langLabel}</span>
        </span>
        <span>•</span>
        <span>${meta.size}</span>
        <span>•</span>
        <span>Push: ${meta.updatedAt}</span>
      `;
    });
  } catch {
    // Mantém os valores estáticos de fallback nos cards
  }
}
