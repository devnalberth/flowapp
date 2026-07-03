# FlowApp — Auditoria de Segurança (jul/2026)

Varredura completa do código feita em 03/07/2026, com foco na preparação do
app para virar SaaS multiusuário. Este arquivo registra o modelo de segurança,
o que foi corrigido e o que ainda precisa ser feito antes de abrir para
usuários pagantes.

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

1. **Rodar as duas migrations de RLS no Supabase** (`enable_rls_policies.sql` +
   `enable_rls_missing_tables.sql`) e conferir que a query de verificação no
   final retorna vazio. Sem isso, com mais de um usuário, os dados financeiros
   e de clientes ficam legíveis entre contas.
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
7. **Headers de produção**: no host (Vercel/Netlify/etc.), configurar
   `Content-Security-Policy`, `X-Frame-Options: DENY` e
   `Referrer-Policy: strict-origin-when-cross-origin`.
