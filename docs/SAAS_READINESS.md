# FlowApp — Roadmap para virar SaaS (seguro e pronto para produção)

Documento vivo. Escrito em 03/07/2026 após a auditoria de segurança
(ver [SECURITY.md](./SECURITY.md)). Lista **tudo** que falta para transformar o
FlowApp de app pessoal em SaaS multiusuário com assinatura, sem vazamentos e
sem sustos operacionais.

Legenda de status: ✅ feito · 🔴 bloqueia lançamento · 🟠 importante · 🟡 desejável

Legenda de esforço: S (horas) · M (1-2 dias) · L (semana+)

---

## Estado atual (o que já está pronto)

- ✅ **RLS em 100% das tabelas** — isolamento entre contas comprovado por teste de invasão real (anon key sem login não lê nem escreve dados de ninguém).
- ✅ Sem segredos no código/histórico; `.env` ignorado.
- ✅ Sem XSS/injeção; auth com reset sem open redirect.
- ✅ Chave de IA (BYOK) só no dispositivo.
- ✅ Dependências de produção limpas.

O que falta é agrupado abaixo em **Backend**, **Frontend**, **Assinaturas/Billing**,
**Infra/DevOps** e **Legal/Produto**.

---

## 1. Backend (Supabase) — 🔴 fundação

| # | Item | Status | Esforço | Por quê |
|---|------|--------|---------|---------|
| 1.1 | Rodar as 2 migrations de RLS em produção | ✅ | — | Já aplicado e verificado |
| 1.2 | **Buckets privados + URL assinada** | 🟠 | M | Hoje `dream-maps`/`study-covers` são públicos: dá para enumerar `user_id` e abrir imagens por URL. Trocar `getPublicUrl` por `createSignedUrl` (TTL curto) e desmarcar "Public bucket" |
| 1.3 | **Coluna de plano protegida** | 🔴 | M | Ver seção Billing. O usuário NÃO pode editar o próprio plano — RLS de UPDATE deve bloquear a coluna, ou o plano fica em tabela à parte só gravável pelo service role |
| 1.4 | **Proxy de IA (Edge Function)** | 🔴 | L | Quando a IA for sua (não BYOK), a chave é SUA e não pode ir ao browser. Edge Function recebe a mensagem, chama o provedor, aplica limite por plano e devolve. Ver seção IA |
| 1.5 | Validação de dados no banco (CHECK/constraints) | 🟠 | M | RLS garante "de quem é", não "se é válido". Ex.: `amount` numérico, `type IN ('income','expense')`, `date NOT NULL`, tamanho máximo de texto. Impede lixo/abuso via API direta |
| 1.6 | Índices em `user_id` + colunas de filtro | 🟡 | S | Com muitos usuários, `WHERE user_id = ...` sem índice fica lento. Índice em todas as FKs e em `(user_id, date)` no financeiro |
| 1.7 | `SECURITY DEFINER` audit | 🟡 | S | Revisar funções/triggers com `SECURITY DEFINER` (rodam como dono, furam RLS). Hoje não há; garantir que continue assim ou que sejam auditadas |
| 1.8 | Backups automáticos + teste de restore | 🟠 | S | Supabase faz backup diário (plano Pro). Confirmar retenção e **testar um restore** antes do lançamento |
| 1.9 | Rate limiting na API | 🟠 | M | Supabase tem limites básicos; para endpoints sensíveis (IA, auth) usar Edge Function com contador por usuário/IP |

---

## 2. Autenticação — 🔴 antes de abrir cadastro

| # | Item | Status | Esforço | Por quê |
|---|------|--------|---------|---------|
| 2.1 | **Confirmação de e-mail obrigatória** | 🔴 | S | Dashboard Supabase → Auth → "Confirm email" ON. Sem isso qualquer um cria conta com e-mail alheio |
| 2.2 | Rate limit de login/signup/reset | 🔴 | S | Dashboard → Auth → Rate limits. Evita brute-force e enumeração de e-mails |
| 2.3 | Política de senha forte | 🟠 | S | Mínimo 8 já no app; ativar também no Supabase (min length + leaked-password protection do HaveIBeenPwned) |
| 2.4 | Templates de e-mail em PT-BR + domínio próprio | 🟠 | M | E-mails de confirmação/reset com sua marca e SMTP próprio (evita cair em spam) |
| 2.5 | OAuth (Google) opcional | 🟡 | M | Reduz atrito de cadastro; Supabase suporta nativo |
| 2.6 | Fluxo de exclusão de conta (LGPD) | 🟠 | M | Usuário precisa poder apagar a conta e todos os dados. Edge Function que remove linhas + arquivos + auth user |
| 2.7 | MFA/2FA | 🟡 | M | Diferencial de confiança; Supabase suporta TOTP |

---

## 3. Assinaturas / Billing — 🔴 o coração do SaaS

> **Regra de ouro:** o frontend NUNCA é fonte de verdade sobre "quem pagou".
> Toda decisão de plano acontece no backend, validada por webhook assinado.

| # | Item | Status | Esforço | Por quê |
|---|------|--------|---------|---------|
| 3.1 | Escolher gateway (Stripe / Mercado Pago / Paddle) | 🔴 | S | Stripe é padrão global; Mercado Pago/Pagar.me melhores para PIX/boleto no Brasil |
| 3.2 | Tabela `subscriptions` (plano, status, período, gateway_id) | 🔴 | M | Só gravável pelo service role. O app lê via RLS (SELECT do próprio), nunca escreve |
| 3.3 | **Webhook de cobrança (Edge Function)** | 🔴 | L | Recebe eventos do gateway (pago, cancelado, falhou), **valida a assinatura do webhook**, atualiza `subscriptions` com service role. É aqui que o plano muda — em lugar nenhum mais |
| 3.4 | Checkout + portal do cliente | 🔴 | M | Stripe Checkout/Customer Portal hospedados (menos PCI para você). Botão "Assinar" abre sessão criada por Edge Function |
| 3.5 | Enforcement de plano (limites/paywall) | 🔴 | M | Frontend esconde features premium (UX), mas o **backend bloqueia de verdade**: RLS/CHECK que barram criar além do limite do plano free (ex.: máx N projetos) |
| 3.6 | Período de trial + graça pós-vencimento | 🟠 | M | Regras de trial e o que acontece quando falha o pagamento (read-only vs bloqueio) |
| 3.7 | Idempotência de webhook | 🟠 | S | Gateways reenviam eventos; guardar `event_id` processado para não duplicar |
| 3.8 | Faturas/recibos + NF (se aplicável) | 🟡 | M | Obrigação fiscal dependendo do volume; gateway costuma emitir recibo |

---

## 4. Camada de IA (FlowChat) — 🔴 quando deixar de ser BYOK

| # | Item | Status | Esforço | Por quê |
|---|------|--------|---------|---------|
| 4.1 | Decidir modelo: BYOK vs IA inclusa | 🔴 | S | Hoje é BYOK (chave do usuário, no device — seguro). Se a IA virar parte da assinatura, a chave passa a ser sua |
| 4.2 | **Edge Function de proxy** | 🔴 | L | A sua chave fica em secret do Supabase (nunca no bundle). A função autentica o usuário, checa plano/cota, chama o provedor e faz streaming de volta |
| 4.3 | Cota/limite de uso por plano | 🔴 | M | Contador de tokens/mensagens por usuário/mês; barra no backend para não estourar seu custo |
| 4.4 | Sanitização de prompt/saída | 🟠 | M | Evitar prompt injection que faça a IA "vazar" contexto de outro usuário — cada request carrega só os dados do próprio `auth.uid()` |
| 4.5 | Log de auditoria de uso | 🟡 | S | Quem usou quanto, para cobrança e detecção de abuso |

---

## 5. Frontend — 🟠 robustez e profissionalismo

| # | Item | Status | Esforço | Por quê |
|---|------|--------|---------|---------|
| 5.1 | **Headers de segurança no host** | 🔴 | S | Na Vercel/Netlify: `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`. Bloqueia clickjacking e injeção |
| 5.2 | Suíte de testes automatizada (Vitest) | 🟠 | M | Os testes de lógica hoje são descartáveis. Fixar `habitStats`, `projectMetrics`, `financeMetrics`, prefs e datas numa suíte que roda no CI |
| 5.3 | CI (GitHub Actions: lint + build + test) | 🟠 | S | Todo push valida antes de subir. Barra regressão e código quebrado |
| 5.4 | Code-splitting por rota (`React.lazy`) | 🟡 | S | Bundle único de 1,4 MB → carregamento inicial mais rápido. Uma linha por página |
| 5.5 | Error boundary + relatório (Sentry) | 🟠 | M | Já há ErrorBoundary; plugar Sentry/GlitchTip para ver erros de produção sem depender do usuário reportar |
| 5.6 | Quebrar arquivos gigantes | 🟡 | M | `Finance.jsx` (~900 linhas) e `AppContext.jsx` (~1200) por domínio — manutenção e onboarding de futuros devs |
| 5.7 | Estados de erro/carregamento consistentes | 🟠 | M | Padronizar skeleton/erro/empty em todas as páginas (hoje varia) |
| 5.8 | Migrar `console.error` sensível → telemetria | 🟡 | S | Não logar dados de usuário no console em produção (já limpamos os debug; revisar os `error`) |
| 5.9 | TypeScript (gradual) | 🟡 | L | O editor já aponta os tipos faltando. Converter services e utils primeiro reduz bugs |
| 5.10 | Acessibilidade final (axe) | 🟡 | M | Rodar auditoria axe/Lighthouse e corrigir contrastes/labels que faltarem |

---

## 6. Infra / DevOps — 🟠 operar sem sustos

| # | Item | Status | Esforço | Por quê |
|---|------|--------|---------|---------|
| 6.1 | Ambientes separados (dev/staging/prod) | 🔴 | M | Projeto Supabase de produção ≠ o de teste. Nunca testar com dados reais de clientes |
| 6.2 | Segredos em cofre (não em `.env` local) | 🟠 | S | Variáveis de produção no painel do host; secrets de Edge Function no Supabase |
| 6.3 | Vite 8 (zerar os 2 avisos de audit) | 🟡 | S | Só afetam o dev server, mas convém subir o major |
| 6.4 | Domínio + HTTPS + www→apex | 🟠 | S | Domínio próprio com SSL (automático na Vercel/Netlify) |
| 6.5 | Monitoramento de uptime + alertas | 🟠 | S | UptimeRobot/BetterStack avisando se cair |
| 6.6 | Dashboard de métricas do Supabase | 🟡 | S | Acompanhar uso de DB/API/storage para não estourar cota do plano |
| 6.7 | Runbook de incidente | 🟡 | S | O que fazer se vazar/cair: rotacionar chaves, restaurar backup, avisar usuários |

---

## 7. Legal / Produto — 🟠 exigido para cobrar

| # | Item | Status | Esforço | Por quê |
|---|------|--------|---------|---------|
| 7.1 | Termos de Uso + Política de Privacidade | 🔴 | M | Obrigatório para cobrar e coletar dados. Mencionar LGPD, quais dados, retenção |
| 7.2 | Conformidade LGPD | 🔴 | M | Base legal, consentimento, direito de exclusão (item 2.6), DPO/contato |
| 7.3 | Consentimento de cookies (se usar analytics) | 🟠 | S | Banner se houver rastreamento não essencial |
| 7.4 | Página de preços + comparativo de planos | 🟠 | M | Free vs Pro claros, com os limites do item 3.5 |
| 7.5 | Suporte (e-mail/chat) + canal de bug | 🟡 | S | Onde o cliente reclama quando algo quebra |

---

## Ordem recomendada (caminho crítico até cobrar o 1º cliente)

1. **Auth de produção** (2.1, 2.2) + **ambientes separados** (6.1) — fundação segura.
2. **Headers de segurança** (5.1) + **buckets privados** (1.2) — fechar as últimas frestas.
3. **Modelo de billing**: tabela `subscriptions` protegida (1.3, 3.2) + **webhook** (3.3) + checkout (3.4) + enforcement (3.5).
4. **Proxy de IA** (4.2, 4.3) — se a IA entrar no plano.
5. **Legal**: Termos + Privacidade + LGPD (7.1, 7.2) + exclusão de conta (2.6).
6. **Rede de segurança**: CI + testes (5.2, 5.3) + Sentry (5.5) + uptime (6.5).
7. Polimento: code-splitting, TypeScript, quebra de arquivos, a11y.

> **Antes de anunciar publicamente**, repetir o teste de invasão da auditoria
> (anon key tentando ler/escrever dados de terceiros) e adicionar um teste novo:
> usuário do plano free tentando criar além do limite e tentando se
> auto-promover a Pro editando a própria linha. Ambos devem ser barrados **pelo
> backend**, não pela UI.
