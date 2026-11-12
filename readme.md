# Rodrigo da Cruz Godinho — Portfólio Interativo & Engenharia DevOps

Aplicação web estática, interativa e orientada a telemetria em tempo real, desenvolvida para demonstrar na prática um ciclo completo de **Integração Contínua e Entrega Contínua (CI/CD)** no GitHub Actions, aliado a consumo assíncrono da **GitHub REST API v3**, animações procedurais em Canvas 2D e auditoria automatizada pós-deploy com **Lighthouse CI**.

---

## Sobre o Projeto

A página foi estruturada como uma jornada narrativa dividida em **cinco capítulos** (*O Prólogo*, *As Cinco Provações de um Commit*, *Crônicas & Construções*, *O Console dos Bastidores* e *Quem Escreve Esta História*), unindo uma atmosfera visual de fantasia a dados reais de engenharia de software e infraestrutura.

Mesmo sendo hospedada em um ambiente 100% estático (**GitHub Pages**), a aplicação atua como um painel vivo do ecossistema do autor no GitHub:

- **Sincronização Completa de Repositórios:** Consulta a API pública do GitHub (`/users/Digooow/repos`) para listar **todos os repositórios públicos** da conta, criando automaticamente cards dinâmicos no Bento Grid para novos projetos assim que são publicados.
- **Detalhamento Multi-Linguagem por Projeto:** Consulta o endpoint `/repos/Digooow/{repo}/languages` de cada repositório para exibir **todas as linguagens de programação utilizadas**, calculando suas proporções em porcentagem e renderizando uma barra visual multicolorida em cada card.
- **Telemetria Real da Pipeline CI/CD:** Hidrata o cabeçalho e o painel da esteira com o número real da última execução (`Run #`), hash curto do commit (`SHA`), duração do build e status do workflow (`/actions/runs`).
- **Console CLI Assíncrono:** Um terminal interativo no navegador com suporte a autocompletar (`Tab`), histórico de comandos (`↑` / `↓`) e comandos que executam diagnósticos reais de rede (`ping`), runtime/DOM (`inspect`), histórico de commits (`git log`) e catálogo de repositórios (`repos`).

---

## Tecnologias Utilizadas

### Front-End & Runtime no Navegador
- **HTML5 Semântico & Acessível** — estrutura validada estaticamente e regiões dinâmicas com `aria-live="polite"`.
- **CSS3 & Tailwind CSS** — *glassmorphism*, tipografia responsiva (`text-wrap: balance` e `text-wrap: pretty`), animações suaves e *scrollbars* padronizadas com fallback progressivo.
- **JavaScript Moderno (ES Modules)** — arquitetura modular sem dependências pesadas de runtime.
- **GitHub REST API v3** — integração client-side com cache inteligente em `localStorage` (TTL de 15 minutos) para respeitar limites de *rate-limiting*.
- **HTML5 Canvas 2D & Performance API** — motor gráfico de partículas com controle de FPS e leitura de métricas reais de carregamento (`PerformanceNavigationTiming`).

### DevOps, Qualidade & Infraestrutura
- **GitHub Actions** — orquestração automatizada da esteira de CI/CD.
- **Node.js 20 & `html-validate 10.17.0`** — *Quality Gate* de análise estática (SAST) de sintaxe, semântica e regras de acessibilidade HTML.
- **GitHub Pages (Edge CDN)** — hospedagem distribuída globalmente com TLS 1.3 e publicação autenticada via token OIDC (`id-token: write`).
- **Lighthouse CI** — auditoria automatizada pós-deploy avaliando Performance, Acessibilidade, Boas Práticas e SEO.

---

## Estrutura do Repositório

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # Pipeline CI/CD (Quality Gate, Deploy e Lighthouse CI)
├── assets/
│   ├── css/
│   │   └── style.css               # Estilos personalizados, animações e glassmorphism
│   ├── img/                        # Cenários panorâmicos de fundo
│   └── js/
│       ├── main.js                 # Ponto de entrada e inicialização dos módulos
│       ├── github-telemetry.js     # Cliente da GitHub REST API (Runs, Commits, Repos e Languages)
│       ├── terminal-cli.js         # Shell assíncrono interativo e inspeção dos nós de CI/CD
│       ├── background-switcher.js  # Transição suave de cenários sincronizada ao scroll
│       ├── canvas-engine.js        # Loop de renderização 2D e gerenciamento de partículas
│       ├── fairy.js                # Entidades luminosas com física de voo orgânica
│       └── mote.js                 # Partículas ambientais de profundidade
├── index.html                      # Página principal estruturada em 5 capítulos
└── readme.md                       # Documentação técnica do projeto
```

---

## Comandos do Console Interativo (`terminal-cli.js`)

Na seção **O Console dos Bastidores**, o visitante pode interagir via teclado (com suporte a `Tab` para autocompletar e setas `↑`/`↓` para histórico) ou pelos botões de atalho rápido:

| Comando | Descrição |
| :--- | :--- |
| `help` | Lista todos os comandos disponíveis no console. |
| `story` | Exibe o prólogo narrativo (*"Era uma vez..."*) que inspira a página. |
| `devops` | Mostra a arquitetura do pipeline e os dados reais da última execução do GitHub Actions. |
| `repos` | Consulta a API do GitHub e lista todos os repositórios públicos sincronizados, com tamanho e data de push. |
| `git log` | Busca em tempo real os últimos 5 commits da branch `main` via GitHub REST API. |
| `ping` | Dispara 3 sondas HTTP (`HEAD`) e calcula a latência real (`min/avg/max` em ms) até a CDN. |
| `inspect` | Lê a `PerformanceNavigationTiming` API para exibir TTFB, tempo de *DOM Interactive*, contagem de nós DOM e threads de CPU. |
| `skills` | Apresenta o arsenal tecnológico em Backend (.NET/C#), Frontend, DevOps e Dados/IA. |
| `about` | Resumo da trajetória acadêmica e profissional do autor. |
| `contact` | Links diretos para GitHub, LinkedIn e LeetCode. |
| `clear` | Limpa o histórico visual do terminal. |

---

## Arquitetura da Pipeline CI/CD

O workflow está definido em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) e é acionado automaticamente a cada `push` na branch `main` (ou manualmente via `workflow_dispatch`).

### 1. Quality Gate (`quality-gate`)
1. Faz o checkout do código com `actions/checkout`.
2. Provisiona o **Node.js 20** com `actions/setup-node`.
3. Instala o validador `html-validate@10.17.0` utilizando a flag de segurança `--ignore-scripts` (mitigando execução arbitrária de scripts de pós-instalação).
4. Executa `html-validate '*.html'`. Qualquer violação sintática, semântica ou de limite de metadados (como títulos acima de 70 caracteres) bloqueia imediatamente o deploy.
5. Todas as Actions de terceiros são fixadas por **hash SHA completo de commit**, garantindo imutabilidade e segurança da cadeia de suprimentos (*Supply Chain Security*).

### 2. Empacotamento e Deploy (`deploy`)
Executado somente após a aprovação do `quality-gate`:
1. Configura o ambiente oficial `github-pages`.
2. Empacota os arquivos estáticos em um artefato imutável via `actions/upload-pages-artifact`.
3. Publica nos servidores de borda do GitHub Pages via `actions/deploy-pages` usando permissões mínimas (`contents: read`, `pages: write`, `id-token: write`) e controle de concorrência (`group: "pages"`).

### 3. Auditoria Pós-Deploy (`lighthouse-audit`)
Após a publicação entrar no ar em `https://digooow.github.io/`, o job `lighthouse-audit` inicializa o **Lighthouse CI** contra a URL de produção, auditando métricas de performance, acessibilidade e SEO e salvando os relatórios da execução.

---

## Execução e Validação Local

Clone o repositório:

```bash
git clone https://github.com/Digooow/Digooow.github.io.git
cd Digooow.github.io
```

Como o projeto utiliza **ES Modules** (`<script type="module">`), sirva a pasta raiz com um servidor HTTP local (por exemplo, a extensão **Live Server** do VS Code ou `npx serve .`).

Para reproduzir localmente a mesma checagem do **Quality Gate** da esteira:

```bash
npm install --global --ignore-scripts html-validate@10.17.0
html-validate "*.html"
```

---

## Autor

**Rodrigo da Cruz Godinho**  
Estudante de Desenvolvimento de Sistemas e IA — SENAC Joinville (SC)

- **Portfólio ao Vivo:** [https://digooow.github.io/](https://digooow.github.io/)
- **GitHub:** [@Digooow](https://github.com/Digooow)
- **LinkedIn:** [linkedin.com/in/digooow](https://linkedin.com/in/digooow)
- **LeetCode:** [leetcode.com/digooow](https://leetcode.com/digooow)
