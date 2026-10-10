# Kamasylvia Realm — Projeto DevOps

Página estática desenvolvida como atividade da disciplina de **DevOps**. O
projeto demonstra um fluxo de **integração contínua e entrega contínua (CI/CD)**
com GitHub Actions, validação automatizada, publicação no GitHub Pages e
auditoria pós-deploy com Lighthouse CI.

## Sobre o projeto

O site apresenta um portfólio temático inspirado em Kamasylvia, com interface
responsiva, efeitos visuais, interações em JavaScript e uma seção que explica o
próprio pipeline de entrega. A aplicação não possui backend: todos os arquivos
publicados são estáticos.

## Objetivos da atividade

- Criar um workflow automatizado com GitHub Actions.
- Validar a qualidade e a sintaxe do HTML antes da publicação.
- Empacotar e publicar uma aplicação estática no GitHub Pages.
- Executar uma auditoria pós-deploy de performance, acessibilidade e SEO.
- Aplicar práticas de segurança e reprodutibilidade no pipeline.
- Compreender o ciclo de CI/CD em um projeto web estático.

## Tecnologias utilizadas

- **HTML5** — estrutura semântica da página.
- **CSS3** — estilos personalizados, responsividade e animações.
- **JavaScript** — interações, terminal do portfólio e efeitos em canvas.
- **Tailwind CSS via CDN** — classes utilitárias e configuração visual.
- **Font Awesome e Google Fonts** — ícones e tipografia.
- **Node.js 20** — ambiente usado pelo Quality Gate.
- **html-validate 10.17.0** — validação da sintaxe e qualidade do HTML.
- **Git e GitHub** — versionamento e colaboração.
- **GitHub Actions** — automação do pipeline.
- **GitHub Pages** — hospedagem da página estática.
- **Lighthouse CI** — auditoria automatizada após o deploy.

## Estrutura do repositório

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml       # Quality Gate, deploy e auditoria
├── assets/
│   ├── css/
│   │   └── style.css        # Estilos personalizados
│   ├── img/                 # Imagens utilizadas no site
│   └── js/
│       └── main.js          # Comportamentos e interações
├── index.html               # Página principal
└── README.md                # Documentação do projeto
```

## Pipeline CI/CD

O workflow está definido em
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Ele é
executado automaticamente a cada `push` na branch `main` e também pode ser
iniciado manualmente pela opção **Run workflow** do GitHub Actions.

### 1. Quality Gate

O job `quality-gate`:

1. Faz o checkout do repositório com `actions/checkout`.
2. Configura o Node.js 20 com `actions/setup-node`.
3. Instala exatamente o `html-validate@10.17.0`.
4. Usa `--ignore-scripts` para impedir a execução de scripts de ciclo de vida
   durante a instalação do pacote.
5. Executa `html-validate '*.html'`.
6. Interrompe o pipeline caso a validação falhe.

As actions externas do workflow são referenciadas por commit SHA completo, em
vez de depender somente de tags mutáveis. Isso torna as execuções
reprodutíveis e reduz o risco de uma dependência externa ser alterada sem
revisão.

### 2. Publicação no GitHub Pages

O job `deploy` só é executado depois da aprovação do `quality-gate`. Ele:

1. Configura o ambiente do GitHub Pages.
2. Empacota o conteúdo da raiz do repositório com
   `actions/upload-pages-artifact`.
3. Publica o artefato com `actions/deploy-pages`.

O job utiliza o ambiente `github-pages` e disponibiliza a URL publicada por
meio da saída `steps.deployment.outputs.page_url`.

### 3. Auditoria pós-deploy

Depois da publicação, o job `lighthouse-audit` executa o Lighthouse CI na URL:

```text
https://digooow.github.io/
```

Essa etapa verifica a qualidade da página publicada, especialmente
performance, acessibilidade e SEO, e armazena os artefatos da auditoria na
execução do workflow.

### Permissões e concorrência

O workflow declara apenas as permissões necessárias para a publicação:

- `contents: read`
- `pages: write`
- `id-token: write`

As execuções usam o grupo de concorrência `pages`, evitando publicações
simultâneas conflitantes.

## Pré-requisitos

- Uma conta no GitHub.
- Git instalado.
- Node.js 20.19 ou superior para reproduzir localmente o Quality Gate.
- Um navegador atualizado.
- Um repositório público com o GitHub Pages habilitado.

Como a aplicação é estática, não é necessário executar um servidor backend.

## Execução local

Clone o repositório:

```bash
git clone https://github.com/Digooow/Digooow.github.io.git
cd Digooow.github.io
```

Para visualizar a página, abra o arquivo `index.html` no navegador. Para uma
experiência mais próxima da publicação, use um servidor HTTP local, como a
extensão **Live Server** do VS Code.

Para reproduzir a validação do workflow localmente:

```bash
npm install --global --ignore-scripts html-validate@10.17.0
html-validate "*.html"
```

## Configuração do GitHub Pages

Para reproduzir a publicação:

1. Acesse **Settings > Pages** no repositório.
2. Em **Build and deployment**, selecione **GitHub Actions** como fonte.
3. Garanta que o workflow tenha as permissões `pages: write` e
   `id-token: write`.
4. Faça um push para a branch `main` ou execute o workflow manualmente.
5. Acompanhe os jobs na aba **Actions**.

O workflow publica o conteúdo da raiz do repositório (`path: '.'`) no ambiente
`github-pages`.

## Resultado da atividade

O resultado é uma página web acessível publicamente, com entrega automatizada e
controle de qualidade integrado. A cada alteração enviada para `main`, o
pipeline:

1. Valida o HTML.
2. Publica a versão aprovada no GitHub Pages.
3. Audita a aplicação publicada com Lighthouse CI.

Esse fluxo representa, em escala reduzida, uma prática DevOps na qual
versionamento, validação, entrega e monitoramento da qualidade fazem parte de
um processo integrado e reproduzível.

## Autor

**Rodrigo da Cruz Godinho**

- GitHub: [@Digooow](https://github.com/Digooow)
- Projeto: [Digooow.github.io](https://github.com/Digooow/Digooow.github.io)