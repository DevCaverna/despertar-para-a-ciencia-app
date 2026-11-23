# Despertar para a Ciência App

Frontend independente em React, TypeScript e Vite. A arquitetura inicial acompanha os padrões úteis do painel Região em Oferta; a identidade visual usa os tokens, a tipografia editorial e a composição do protótipo local Despertar para a Ciência.

## Requisitos e instalação

- Node.js 24.
- pnpm 12.3.4 (veja `packageManager` em `package.json`).

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Configure `.env.local` com a URL da API e os valores públicos de configuração do Firebase Web SDK antes de usar autenticação. A aplicação não aceita credenciais privadas do Firebase Admin, chaves HMAC ou segredos da API.

Para ler o feed e as publicações sem login, basta configurar `VITE_API_URL`. As variáveis do Firebase podem ser omitidas.

## Validação local

```sh
pnpm format:check
pnpm build       # TypeScript + bundle de produção
pnpm lint
pnpm test
```

## Integração local da API

Use o repositório irmão `../despertar-para-a-ciencia-api` para iniciar a API, PostgreSQL, Redis e Firebase Auth Emulator conforme os requisitos e a documentação próprios da API. A configuração de desenvolvimento da API está em `docs/operacao/ambientes-e-segredos.md` e `docs/arquitetura/autenticacao-e-usuarios.md`.

Para o fluxo ponta a ponta:

1. Configure na API `NODE_ENV=development`, `MAIL_DRIVER=local-capture`, `SEND_EMAILS=true`, PostgreSQL, Redis e o projeto do Firebase Auth Emulator. A API captura as mensagens em `.local-mail/verification-emails.jsonl`.
2. Na configuração local da API, permita a origem do Vite, por exemplo `CORS_ORIGINS=http://localhost:5173`.
3. No `.env.local` do frontend, informe o mesmo `VITE_FIREBASE_PROJECT_ID` da API, a configuração Web do projeto de desenvolvimento e `VITE_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099`.
4. Inicie API e dependências seguindo as instruções de seus repositórios, depois execute `pnpm dev` neste projeto. Para completar o cadastro, solicite o código normalmente na interface e consulte a mensagem capturada pela API; informe o código recebido na tela. O frontend não possui bypass de verificação.

Sem `VITE_FIREBASE_AUTH_EMULATOR_URL`, o SDK utiliza o serviço Firebase configurado. Não configure o Emulator apontando para um projeto de produção.

## Fluxos implementados

- Cadastro por nome, e-mail e senha, solicitação do código temporário por API, verificação e criação/reconciliação do perfil.
- Retomada de cadastro quando a conta Firebase já existe sem perfil local; senha, código e ID Token não são gravados em `localStorage` ou `sessionStorage`.
- Login e restauração de sessão Firebase; carregamento do perfil local e apresentação específica para perfil ausente, inativo ou falha recuperável.
- Renovação controlada do ID Token uma vez após `401` em requisições autenticadas, logout e navegação entre feed, login e cadastro.
- Feed público em `/`, com paginação em `/?page=2`. A consulta `GET /posts?page=1&perPage=20` não envia token e retorna `{ items, page, perPage, hasNextPage }`. Cada item contém `id`, `title`, `publishedAt` (ISO 8601) e `author` (`{ id, name }` ou `null`). A ordem da API é preservada.
- Leitura pública em `/posts/:id`. `GET /posts/:id` recebe um UUIDv7 e retorna os mesmos campos públicos do feed mais `content` (texto simples). A API não retorna posts não publicados. Os links do feed preservam a página de origem para o retorno, sem alterar a URL da publicação.
- Página de boas-vindas autenticada em `/dashboard`, provisória e sem autorização por papel no frontend.
- Consulta de trabalhos acadêmicos importados em `/academic-works` e `/academic-works/:id`, disponível a colaboradores e administradores com perfil ativo. A lista é paginada; o detalhe mostra autores, fonte, data parcial, resumo, DOI e URL quando presentes. A seleção encaminha o ID do trabalho a `/academic-works/:id/generate`; a criação assistida do rascunho depende da integração de geração da API.

Os endpoints e corpos seguem a documentação atual da API (`POST /users/send-email-verification-code`, `POST/GET/PATCH /users/profile`). Claims de perfil são atualizadas pela API; após o cadastro, o Firebase ID Token é renovado antes de novas requisições autenticadas.
O app consulta as claims `roles` do ID Token ao carregar o perfil para mostrar as rotas editoriais; a API continua responsável por autorizar cada requisição.

## Organização

- `src/components`, `contexts`, `layouts`, `pages`: estrutura de interface e sessão.
- `src/services`: Firebase, cliente Axios único e serviços de perfil e publicações.
- `src/models`, `dtos`, `schemas`, `utils`, `locales`: tipos e responsabilidades compartilhadas.
- `AGENTS.md`: instruções do projeto e roteamento para ai-memory.
- `.agents/memory/`, `.agents/prompts/`, `.agents/skills/`: conhecimento, prompts e skills reutilizáveis versionados.
- `.agents/artifacts/`: planos e arquivos temporários ignorados pelo Git.
