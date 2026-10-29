# Elicani

Plataforma SaaS multi-tenant de e-commerce: cada lojista cria sua loja pública em
`{slug}.elicani.site`. Este repositório contém a **Fase 1**: autenticação, criação
de loja, painel funcional (Dashboard e Settings), isolamento multi-tenant no banco
(RLS) e a arquitetura de roteamento da vitrine — o conteúdo da vitrine vem nas
próximas fases.

## Stack

- **Next.js 16** (App Router, Cache Components, Partial Prerender) + **TypeScript** estrito
- **Tailwind CSS** + **shadcn/ui**
- **Supabase**: Auth (e-mail + senha), Postgres + RLS, Storage
- **Vercel** para deploy (build Turbopack; ver nota sobre Termux abaixo)

Fora do escopo desta fase (e deliberadamente ausente): Redis, Docker, microserviços,
backend separado, GraphQL, pagamentos, WhatsApp API, IA, filas, libs extras de estado.

## Como rodar

```bash
# 1. Dependências
npm install

# 2. Ambiente
cp .env.example .env.local   # preencha com as credenciais do projeto Supabase

# 3. Schema (idempotente; usa a Management API do Supabase)
npm run db:push

# 4. Desenvolvimento
npm run dev                  # http://localhost:3000
```

`npm run db:push` aplica as migrações de `supabase/migrations/` via Management API
(sem Docker). Reexecute à vontade — cada migração é idempotente. Para trabalhar
localmente com o CLI do Supabase em vez da Management API, use
`supabase db push` com o projeto linkado.

## Variáveis de ambiente

Ver `.env.example` (fonte única; sincronizado com `src/lib/env.ts`):

| Variável | Onde usar | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | chave pública; segura no browser porque o RLS limita tudo |
| `SUPABASE_SERVICE_ROLE_KEY` | só scripts (`test:rls`) | privilegiada; nunca vai para o bundle |
| `NEXT_PUBLIC_SITE_URL` | server | **base da aplicação/auth**: `https://app.elicani.site` em produção, `http://localhost:3000` em dev — todos os redirects do Supabase Auth derivam dela |
| `NEXT_PUBLIC_MARKETING_URL` | server | site de marketing: `https://elicani.site` em produção (apenas metadados/OG; nunca participa de Auth) |
| `NEXT_PUBLIC_STORE_DOMAIN` | server | base do wildcard das vitrines: `elicani.site` em produção, `localhost` em dev |

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | landing page do Elicani (marketing) |
| `/signup`, `/login` | autenticação por e-mail + senha |
| `/forgot-password` | pedido de redefinição de senha (envia link por e-mail) |
| `/reset-password` | destino do link de recuperação; troca o `?code=` (PKCE) por sessão e grava a nova senha |
| `/app` | painel (protegido) — Dashboard com dados reais da loja |
| `/app/onboarding` | criação da loja (nome, slug, WhatsApp, país, idioma, moeda) |
| `/app/settings` | edição da loja (funcional) |
| `/app/products`, `/orders`, `/customers`, `/delivery`, `/reports` | placeholders honestos ("Coming soon") |
| `/store/[slug]` | vitrine pública (roteamento pronto, conteúdo nas próximas fases) |
| `{slug}.elicani.site` | o proxy reescreve para `/store/[slug]` |

## Autenticação

### Arquitetura de domínios

| Domínio | Papel |
| --- | --- |
| `elicani.site` | site de **marketing** |
| `app.elicani.site` | **aplicação do lojista**: signup, login, confirmação de e-mail, recuperação de senha, painel |
| `*.elicani.site` | **vitrines públicas** (`{slug}`) — nunca participam de redirects de Auth |

A base de autenticação em produção é `NEXT_PUBLIC_SITE_URL=https://app.elicani.site`;
em desenvolvimento, `http://localhost:3000`. O wildcard de vitrines é arquitetura
DNS/Vercel, **não** configuração de Auth — nenhum loja individual aparece na
allowlist de redirects do Supabase.

### Configuração do Supabase Auth (produção)

- **Site URL**: `https://app.elicani.site`
- **Redirect URLs (allowlist)**: `https://app.elicani.site/**`, `http://localhost:3000/**`
- **Confirm Email**: **ATIVADO** (`mailer_autoconfirm=false`) — signup não cria
  sessão; o formulário exibe "check your email" e o lojista só entra após confirmar.
- O e-mail de confirmação de signup redireciona para `${NEXT_PUBLIC_SITE_URL}/login`
  (`emailRedirectTo` em `signupAction`); o de recuperação, para
  `${NEXT_PUBLIC_SITE_URL}/reset-password` (`redirectTo` em `forgotPasswordAction`).

### Fluxos

- **Fase 1: e-mail + senha.** Telefone/WhatsApp é **dado de negócio** (contato da
  loja), nunca credencial. A confirmação de e-mail está ativa no Supabase: após o
  signup o usuário vê o aviso "check your email" e só entra depois de confirmar.
- **Recuperação de senha**: `/forgot-password` → `resetPasswordForEmail` (resposta
  genérica, sem enumerar contas) → link do e-mail cai em `/reset-password?code=`
  (PKCE) → a server action troca o `code` por sessão (lê o verificador no cookie
  do browser), grava a nova senha e manda para `/app`. Link expirado/inválido
  mostra erro + pedido de novo link.
- Sessão em cookies via `@supabase/ssr`; o **proxy** (`src/proxy.ts`, no Next 16 o
  middleware chama-se `proxy`) renova o token a cada requisição.
- Visitante sem sessão em `/app*` → redirect para `/login?next=...`; usuário logado
  em `/login`, `/signup` ou `/forgot-password` → redirect para `/app` (ou para
  `next`, se interno). Quem chega sem `next` e já tem loja cai direto no Dashboard;
  sem loja, no onboarding. `/reset-password` fica de fora de propósito: um lojista
  logado ainda precisa poder concluir o link de recuperação.
- Redirects pós-login validam `next` no proxy **e** nas server actions
  (`isSafeInternalPath`: só caminhos internos iniciados por `/`, sem `//` nem
  `://`) — open redirect é impossível e storefront nunca vira destino de Auth.
- Defesa em profundidade: proxy **e** layouts/server actions validam a sessão
  (`requireUser()`), nunca filtrando no frontend.
- Para adicionar OTP por telefone no futuro: basta um novo método de autenticação —
  `profiles.email` é anulável e nenhum constraint de banco depende de e-mail.

## Multi-tenancy e RLS

Tabelas (UUID, `created_at`/`updated_at`, constraints e índices nas migrações):

- **`profiles`** — `id` PK = `auth.users.id`, `email` (anulável, ver acima),
  `full_name`. Um registro por usuário (trigger no signup).
- **`stores`** — 17 colunas incl. `owner_id` (FK → `auth.users`, **UNIQUE**:
  uma loja por lojista), `slug` (**UNIQUE**, normalizado), `name`, `description`,
  `logo_url`, `phone`, `phone_country_code`, `whatsapp_number`, `country`,
  `language`, `currency`, `timezone`, `primary_color`, `is_active`,
  `created_at`, `updated_at`.

Invariantes do modelo:

1. `owner_id → store_id`: todo recurho de lojista aponta para a loja dona;
2. RLS ativo **no banco** — o backend nunca é a única barreira;
3. leitura pública restrita ao papel `anon` (lojas **ativas**): um lojista
   autenticado não lê lojas alheias nem pela API;
4. políticas de Storage por pasta `{store_id}/*` (bucket público `store-logos`,
   máx. 2 MB, só imagens).

Políticas (11 no total; texto completo em `supabase/migrations/`):

| Tabela | Política | Quem | O que |
| --- | --- | --- | --- |
| `profiles` | select/update/insert | `authenticated` | só a própria linha (`id = auth.uid()`) |
| `stores` | select (painel) | `authenticated` | só lojas próprias (`owner_id = auth.uid()`) |
| `stores` | insert | `authenticated` | só com `owner_id = auth.uid()` (RLS `WITH CHECK`) |
| `stores` | update/delete | `authenticated` | só lojas próprias |
| `stores` | select (vitrine) | `anon` | só lojas `is_active` |
| `store-logos` | select | `todos` | leitura pública do bucket |
| `store-logos` | insert/update/delete | `authenticated` | só pasta da própria loja |

Verificação automatizada: `npm run test:rls` cria 3 usuários de teste, exercita
leitura/escrita entre tenants, slug/owner duplicados, anon e Storage, e limpa tudo
depois (usa `SUPABASE_SERVICE_ROLE_KEY`).

## Slugs

Minúsculas, números e hífens, normalizados (`slugify`), 3–48 caracteres, únicos no
banco. Reservados (lista em `src/lib/stores/slug.ts`, fácil de estender):
`app, admin, api, www, login, signup, dashboard, settings, support, help, docs,
status` + colisões com rotas internas. O slug é imutável na Fase 1. O DNS wildcard
nunca é gerenciado pelo código — é configuração de infra.

## i18n

- Idioma padrão: **`en`**. Suportados: `en, pt-BR, pt-PT, es, fr, de, ar, zh-Hans,
  ja` (BCP 47, `src/lib/i18n/config.ts`). `ar` resolve para RTL automaticamente.
- Chaves planas com `{param}` (`src/lib/i18n/messages/en.ts` é a fonte do tipo
  `MessageKey`); outros idiomas são `Partial<Messages>` mesclados sobre `en`.
- Resolução: cookie `elicani_locale` lido no servidor (`getLocale()`); sem seletor
  de UI na Fase 1.
- **Idioma, moeda e país são independentes**: Moçambique + inglês + USD é válido
  (coberto por teste e por E2E real de onboarding).
- A vitrine fala o idioma **da loja** (`store.language`).

**Como adicionar um idioma:** crie `src/lib/i18n/messages/<locale>.ts` exportando
um `Partial<Messages>` com o que quiser traduzir (o resto cai para `en`), adicione
a locale em `SUPPORTED_LOCALES`/`LOCALE_LABELS` e rode os testes. Nenhuma página
precisa mudar.

## Moedas

ISO 4217: `USD, EUR, GBP, CAD, AUD, BRL, MZN, ZAR, AOA, NGN, KES, GHS, INR, CNY,
JPY` (`src/lib/currency.ts`). Sem símbolos hardcoded: `formatCurrency(amount,
currency, locale)` usa `Intl.NumberFormat` (JPY sem decimais, BRL em `pt-BR`, etc).
Validação no cliente e no servidor rejeita códigos fora da lista.

## Deploy (Vercel)

1. Importe o repositório no Vercel e configure as variáveis de `.env.example`
   (produção: `NEXT_PUBLIC_SITE_URL=https://app.elicani.site`,
   `NEXT_PUBLIC_MARKETING_URL=https://elicani.site`,
   `NEXT_PUBLIC_STORE_DOMAIN=elicani.site`) e no Supabase Auth (Site URL
   `https://app.elicani.site`, allowlist `https://app.elicani.site/**` e
   `http://localhost:3000/**`, Confirm Email ativado — ver seção Autenticação).
2. No provedor de DNS de `elicani.site`, aponte um **wildcard** para o deploy:
   - `*.elicani.site` → CNAME `cname.vercel-dns.com`
   - `app.elicani.site` → CNAME `cname.vercel-dns.com` (o wildcard não cobre subdomínios de dois níveis)
   - `elicani.site` → A/ALIAS conforme o painel do Vercel
3. Adicione os domínios no projeto Vercel (Settings → Domains). O proxy cuida do
   resto: `www` → apex e `{slug}.*` → `/store/[slug]`.

## Notas de desenvolvimento (Next 16)

- **`middleware.ts` virou `src/proxy.ts`** com função exportada `proxy`.
- **Cache Components** (`cacheComponents: true`): `dynamic`/`revalidate` foram
  removidos; leitura de `cookies()` precisa ficar atrás de `<Suspense>`.
- **Padrão obrigatório para Supabase em Server Components:** toda leitura
  autenticada passa por funções com `'use cache: private'`
  (`getUser`, `getStoreForOwner`, `getProfile` em `src/lib/`). Sem isso, o
  `Date.now()` interno do auth-js roda durante o prerender e o Next 16 loga
  "unstable value" a cada requisição. Funções privadas rodam em tempo de
  requisição, ficam fora do shell estático e deduplicam por requisição.
- **Termux (Android/arm64):** o Turbopack não tem binding nativo para a plataforma.
  Rode o build de verificação com `npx next build --webpack`. Na Vercel o build
  padrão (Turbopack) funciona normalmente.
- `new Date()` durante o prerender é erro de build — rodapés usam literais.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | desenvolvimento |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm test` | testes de unidade (slug, moedas, países, i18n) via `node --test` |
| `npm run test:rls` | verify de isolamento multi-tenant no banco real |
| `npm run db:push` | aplica migrações (Management API, idempotente) |
| `npx next build --webpack` | build de produção (Termux; ver acima) |

## Estrutura

```
supabase/migrations/   4 migrações aplicadas (schema, RLS, i18n, vitrine anon)
scripts/               db-push.mjs (migrações), verify-rls.mjs (isolamento)
src/proxy.ts           wildcard, www→apex, refresh de sessão, guardas /app
src/lib/i18n/          config, messages/en.ts, translate, locale (server-only)
src/lib/currency.ts    ISO 4217 + Intl
src/lib/countries.ts   ISO 3166-1 + Intl.DisplayNames
src/lib/stores/        slug, resolve, queries ('use cache: private'), actions
src/lib/supabase/      client (browser), server (cookies), public (anon, vitrine)
src/components/store/  StoreForm compartilhado (onboarding + settings)
src/app/               (marketing), (auth), app/{onboarding,(dashboard)}, store/[slug]
```
