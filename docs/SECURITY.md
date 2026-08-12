# FlowApp — Auditoria de Segurança

Registro do modelo de segurança, do que foi corrigido e do que ainda falta.
Duas auditorias até aqui:

- **03/07/2026** — varredura inicial, com foco em virar SaaS multiusuário.
- **12/08/2026** — reauditoria contra as cinco falhas mais comuns em apps
  Supabase/Firebase (RLS, permissão no cliente, IDOR, chaves expostas, XSS).
  Resultado no fim deste arquivo.

## Modelo de segurança

- **SPA (Vite/React) + Supabase.** A `anon key` é pública por definição —
  qualquer proteção no JavaScript (filtros `.eq('user_id', ...)`) é apenas
  conveniência. **A fronteira de segurança real é o RLS (Row Level Security)
  no Postgres.** Toda tabela nova DEVE nascer com RLS + políticas de dono.
- **Chave de IA (FlowChat)**: BYOK — fica somente no `localStorage` do
  dispositivo (`flowapp_jarvis_config`), nunca é enviada ao banco.
- **Auth**: Supabase Auth (e-mail/senha), sessão em localStorage ou
  sessionStorage conforme "lembrar de mim".

## Corrigido nesta auditoria

| Item | Correção |
|---|---|
| 8 tabelas sem RLS no repositório (`clients`, `events`, `finance_accounts`, `finance_cards`, `finance_categories`, `finance_limits`, `finance_tags`, `focus_logs`) | Migration `prisma/migrations/enable_rls_missing_tables.sql` — **rodar no SQL Editor** |
| Uploads de storage sem restrição de pasta | Mesma migration: políticas limitando escrita à pasta `<user_id>/` nos buckets `dream-maps` e `study-covers` |
| Logs de debug despejando dados do usuário no console (payloads de metas/tarefas/mapas, nome de tarefas no timer) | Removidos (`goalService`, `taskService`, `dreamMapService`, `userService`, `supabaseClient`, `Tasks.jsx`) |
| Senha mínima inconsistente (6 no perfil vs 8 no reset) | Unificada em 8 caracteres |
| Dependências vulneráveis (10 avisos: lodash, defu, ws, babel etc.) | `npm audit fix` → restam 2 (esbuild/vite, só afetam o **dev server**; somem ao subir para Vite 8) |
| Refs git corrompidas (`main 2`) quebrando comandos | Removidas |

## Verificado e OK

- Sem segredos hardcoded no código nem no histórico do git; `.env` ignorado e nunca commitado.
- Sem `dangerouslySetInnerHTML`/`eval`/`innerHTML`; todo texto de usuário e do chat renderiza como texto React (escape automático).
- Sem interpolação de entrada do usuário em filtros PostgREST (`.or(\`...\`)` etc.).
- Links externos com `rel="noreferrer"`; sem `window.open`.
- Login com `autoComplete` correto; reset de senha com `redirectTo` fixado em `window.location.origin` (sem open redirect).
- Tabelas principais (users, tasks, projects, goals, habits, finance_transactions, study_*, dream_maps, finance_recurrences) já tinham RLS em `enable_rls_policies.sql`.

## Pendências ANTES de virar SaaS (por prioridade)

1. ~~**Rodar as duas migrations de RLS no Supabase**~~ — ✅ **FEITO** (12/08/2026).
   Verificado no banco: 19/19 tabelas com RLS ativo e políticas de dono.
2. **Proxy de IA no backend**: o SDK Anthropic roda com
   `dangerouslyAllowBrowser: true` porque a chave é do próprio usuário (BYOK).
   Num SaaS em que VOCÊ fornece a IA, a chave é sua — precisa de um backend
   (Edge Function do Supabase resolve) que recebe a mensagem, chama o provedor
   e aplica limites de uso por assinatura. Nunca embarcar a sua chave no front.
3. **Assinaturas/pagamentos**: webhooks de cobrança (Stripe etc.) e checagem de
   plano DEVEM rodar no backend (Edge Function com service role) — o front não
   pode ser fonte de verdade sobre "quem é assinante". Coluna de plano na
   tabela `users` protegida contra UPDATE pelo próprio usuário (política
   separada ou coluna em tabela à parte só gravável pelo service role).
4. **Imagens privadas**: buckets hoje são públicos (`getPublicUrl`). Migrar
   para `createSignedUrl` + bucket privado se as imagens de estudos/mapa dos
   sonhos forem consideradas sensíveis.
5. **Confirmação de e-mail + rate limits**: habilitar "Confirm email" no
   Supabase Auth e revisar rate limits de auth no dashboard antes do lançamento.
6. **Vite 8**: subir major para zerar os 2 avisos restantes do `npm audit`
   (afetam apenas o dev server local).
7. ~~**Headers de produção**~~ — ✅ **FEITO** (12/08/2026), em `vercel.json`:
   CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy` e HSTS.


---

# Reauditoria — 12/08/2026

Varredura do código inteiro (não só do diff) contra as cinco falhas mais comuns
em apps que falam direto com o banco. **Nenhuma das cinco ficou aberta.**

| # | Classe | Situação |
|---|---|---|
| 1 | Banco sem RLS | ✅ 19/19 tabelas com RLS ativo, verificado no banco |
| 2 | Permissão no front-end | ✅ Não se aplica — o app não tem roles nem admin |
| 3 | IDOR | ✅ RLS confirmado; filtro de dono acrescentado onde era possível |
| 4 | Chaves expostas | ✅ 158 commits varridos, zero segredos |
| 5 | XSS | ✅ Sem sinks de HTML; `javascript:` bloqueado no código e pela CSP |

## 1. RLS — verificado no banco, não só no repositório

A auditoria de julho deixou "rodar as migrations" como pendência. Foram
executadas, e o estado foi conferido lendo `pg_policy` política a política:

- 19/19 tabelas com `relrowsecurity = true`.
- Toda política filtra por `auth.uid()`; nenhuma com `USING (true)`.
- `users` tem 3 políticas de propósito (select/insert/update, sem delete).
- `study_modules`/`study_lessons` protegidas pelo encadeamento até
  `study_items.user_id` — correto, já que não têm `user_id` próprio.
- Políticas com papel `{public}` **falham fechado**: numa requisição anônima
  `auth.uid()` é NULL e `NULL = user_id` não é verdadeiro. `TO authenticated`
  seria mais explícito, mas a diferença é de clareza, não de segurança.

Nove tabelas apareceram com 8 políticas em vez de 4 — dois conjuntos com
expressões idênticas. Sem brecha (PERMISSIVE combina por OR, e regras iguais
dão o mesmo resultado), mas ambíguo de ler. Limpeza opcional em
`prisma/migrations/20260812_rls_cleanup_duplicate_policies.sql`.

## 2. Permissão no front-end

Não há `isAdmin`, `role`, plano ou qualquer decisão de permissão no cliente.
O app é mono-usuário: não existe hierarquia para escalar. O único dado de
identidade no `localStorage` é o token do Supabase, assinado e validado no
servidor.

## 3. IDOR

Sem backend próprio, o RLS é a única fronteira real — e ele está ativo.
Como defesa em profundidade, `updateStudy` e `deleteStudy` passaram a exigir
`user_id` no `WHERE`. Assim, se alguma política cair por engano, a operação
vira "linha não encontrada" em vez de escrita silenciosa em dado alheio.

`study_modules` e `study_lessons` **não** recebem esse filtro: não têm coluna
`user_id`, e o PostgREST não faz join em `update`/`delete`. Ali só o RLS
protege — por isso as políticas encadeadas são obrigatórias.

## 4. Chaves expostas

Varredura dos 158 commits (`git grep` sobre todos os blobs de `git rev-list --all`):

- Nenhum JWT (`eyJ…`) em nenhum commit — nem anon, nem service_role.
- Nenhum `sk-ant-api`, `sk-proj-`, `service_role`, `AKIA…`, `ghp_…`, `xoxb-`.
- Nenhuma chave privada nem connection string com senha.
- `.env.example` e `.env.production` são os únicos `.env` versionados, e ambos
  só tiveram placeholders / `VITE_APP_URL` em todo o histórico.
- `dist/` nunca foi commitado.

**Ressalva conhecida:** o repositório é público e o bundle publicado contém
nomes de tabela e coluna (são strings literais enviadas ao PostgREST, o
minificador não pode alterá-las). O schema também é obtível via OpenAPI do
PostgREST com a anon key. Isso é inerente à arquitetura SPA-direto-ao-banco:
esconder o schema seria *security through obscurity* e não protegeria nada.
Com RLS ativo, conhecer o schema não dá acesso a dado nenhum.

Pendência menor: `src/pages/Tasks/Tasks.jsx` tem um e-mail pessoal no
`DEFAULT_USER` de fallback. Não é credencial, mas fica indexável num repo
público.

## 5. XSS

Nenhum `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`,
`eval` ou `new Function` em todo o projeto — o escape automático do React cobre
todo texto de usuário.

Um vetor real foi encontrado e corrigido: `study.url` ia cru para um `href`.
`<input type="url">` **não** barra `javascript:`, que é uma URL absoluta válida
— e um href assim, clicado, conseguiria ler a chave de IA do `localStorage`.
Corrigido com `src/utils/safeUrl.js`, que só aceita `http:`/`https:`. A CSP
adicionada em `vercel.json` é a segunda camada: `script-src 'self'` bloqueia
`javascript:` URIs independentemente do código.

## Como reauditar

```sql
-- 1. Toda tabela tem RLS ativo e políticas?
SELECT c.relname, c.relrowsecurity, count(p.polname) AS politicas
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relrowsecurity, count(p.polname);

-- 2. Alguma política sem filtro de dono?
SELECT tablename, policyname, cmd, coalesce(qual, with_check) AS expressao
FROM pg_policies
WHERE schemaname = 'public'
  AND (coalesce(qual, with_check) IS NULL
       OR btrim(coalesce(qual, with_check)) = 'true'
       OR coalesce(qual, with_check) NOT ILIKE '%auth.uid()%');
-- Vazio = tudo certo.
```

```bash
# 3. Segredo em qualquer commit do histórico
git grep -InE 'eyJ[A-Za-z0-9_-]{10,}\.eyJ|sk-ant-api|service_role|AKIA[0-9A-Z]{16}' $(git rev-list --all)
# Vazio = tudo certo.
```
