# Kamasylvia Realm — Projeto DevOps

Página estática desenvolvida como atividade da disciplina de **DevOps**. O
projeto tem como foco a criação de um workflow de **CI/CD com GitHub Actions** e
a publicação automática de uma aplicação web utilizando o **GitHub Pages**.

## Sobre o projeto

O site apresenta um portfólio temático inspirado em Kamasylvia, com uma
interface responsiva, efeitos visuais e uma seção que explica o próprio
pipeline de entrega. Além da página, o projeto demonstra um fluxo automatizado
para validar, publicar e auditar a aplicação a cada alteração na branch
principal.

## Objetivos da atividade

- Criar um workflow automatizado com GitHub Actions.
- Aplicar uma etapa de controle de qualidade antes da publicação.
- Fazer o build e o empacotamento de uma página estática.
- Realizar o deploy da aplicação pelo GitHub Pages.
- Executar uma auditoria pós-deploy de performance e acessibilidade.
- Compreender conceitos de integração contínua e entrega contínua (CI/CD).

## Tecnologias utilizadas

- **HTML5** — estrutura da página.
- **CSS3** — estilos, responsividade e animações.
- **JavaScript** — interações, transições de fundo e efeitos em canvas.
- **Tailwind CSS via CDN** — classes utilitárias e configuração visual.
- **Font Awesome e Google Fonts** — ícones e tipografia.
- **Git e GitHub** — versionamento e hospedagem do código.
- **GitHub Actions** — automação do pipeline.
- **GitHub Pages** — hospedagem da página estática.
- **Lighthouse CI** — auditoria automatizada após o deploy.

## Estrutura do repositório

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml       # Workflow de qualidade, deploy e auditoria
├── assets/
│   ├── css/
│   │   └── style.css        # Estilos personalizados
│   ├── img/                 # Imagens utilizadas no site
│   └── js/
│       └── main.js          # Comportamentos e interações
├── index.html               # Página principal
└── readme.md                # Documentação do projeto
```

## Pipeline CI/CD

O workflow está definido em
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) e é executado
automaticamente quando ocorre um `push` na branch `main`. Também é possível
iniciá-lo manualmente pela opção **Run workflow** do GitHub Actions.

### 1. Quality Gate

O job `quality-gate`:

1. Executa o checkout do repositório.
2. Verifica a sintaxe e a qualidade dos arquivos HTML usando
   `cycjimmy/html-check-action@v2`.
3. Impede a continuação do pipeline caso a validação falhe.

### 2. Build e deploy

O job `deploy` só é executado depois da aprovação do `quality-gate`. Nessa
etapa, o workflow:

1. Configura o ambiente do GitHub Pages.
2. Empacota os arquivos estáticos do projeto com
   `actions/upload-pages-artifact@v3`.
3. Publica o artefato com `actions/deploy-pages@v4`.

Após a publicação, o endereço da página é disponibilizado pelo ambiente
`github-pages` no próprio workflow.

### 3. Auditoria pós-deploy

Depois do deploy, o job `lighthouse-audit` executa o Lighthouse CI na URL
publicada:

```text
https://digooow.github.io/
```

Essa etapa permite acompanhar indicadores de performance e acessibilidade e
gera artefatos da auditoria para consulta na execução do workflow.

## Pré-requisitos

- Uma conta no GitHub.
- Git instalado.
- Um navegador atualizado.
- Um repositório público com o GitHub Pages habilitado.

Como a aplicação é estática, não é necessário instalar dependências ou
executar um servidor backend.

## Execução local

Clone o repositório:

```bash
git clone https://github.com/Digooow/Digooow.github.io.git
cd Digooow.github.io
```

Depois, abra o arquivo `index.html` no navegador. Para uma experiência mais
próxima da publicação, também é possível utilizar qualquer servidor HTTP
local, por exemplo a extensão **Live Server** do VS Code.

## Configuração do GitHub Pages

Para reproduzir a publicação:

1. Acesse **Settings > Pages** no repositório.
2. Em **Build and deployment**, selecione **GitHub Actions** como fonte.
3. Garanta que o workflow tenha as permissões `pages: write` e
   `id-token: write`.
4. Faça um push para a branch `main`.
5. Acompanhe a execução na aba **Actions**.

O job de deploy utiliza o ambiente `github-pages` e publica o conteúdo da raiz
do repositório (`path: '.'`).

## Resultado

O resultado da atividade é uma página web acessível publicamente, com entrega
automatizada. A cada novo push na branch `main`, o código passa pelo quality
gate, é publicado no GitHub Pages e, em seguida, é submetido a uma auditoria
automatizada.

Esse fluxo representa, em escala reduzida, uma prática de DevOps na qual
versionamento, validação, entrega e monitoramento da qualidade fazem parte de
um processo integrado.

## Autor

**Rodrigo da Cruz Godinho**

- GitHub: [@Digooow](https://github.com/Digooow)
- Projeto: [Digooow.github.io](https://github.com/Digooow/Digooow.github.io)