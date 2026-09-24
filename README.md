# Despertar para a Ciência App

Frontend independente em React, TypeScript e Vite. A arquitetura inicial acompanha os padrões úteis do painel Região em Oferta; a identidade visual usa os tokens, a tipografia editorial e a composição do protótipo local Despertar para a Ciência.

## Requisitos e instalação

- Node.js compatível com Vite 7.
- pnpm 10.33.2 (veja `packageManager` em `package.json`).

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Configure `.env.local` com a URL da API e os valores públicos de configuração do Firebase Web SDK antes de usar autenticação. A aplicação não aceita credenciais privadas do Firebase Admin, chaves HMAC ou segredos da API.

## Validação local

```sh
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
- Renovação controlada do ID Token uma vez após `401`, logout e navegação entre início, login e cadastro.
- Página inicial mínima sem feed ou conteúdo fictício.

Os endpoints e corpos seguem a documentação atual da API (`POST /users/send-email-verification-code`, `POST/GET/PATCH /users/profile`). Claims de perfil são atualizadas pela API; após o cadastro, o Firebase ID Token é renovado antes de novas requisições autenticadas.

## Organização

- `src/components`, `contexts`, `layouts`, `pages`: estrutura de interface e sessão.
- `src/services`: Firebase, cliente Axios único e serviço de perfil.
- `src/models`, `dtos`, `schemas`, `utils`, `locales`: tipos e responsabilidades compartilhadas.
- `.agents/artifacts/`: planos e arquivos temporários não versionados.
