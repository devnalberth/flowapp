-- ============================================================
-- RLS: remover políticas duplicadas
-- ============================================================
-- Auditoria de 12/08/2026: nove tabelas apareceram com 8 políticas em vez de 4.
-- Dois conjuntos coexistiam — o versionado neste repositório e outro criado à
-- mão (dashboard ou script antigo, fora do Git).
--
-- ISTO NÃO É CORREÇÃO DE FALHA. Foi verificado política a política que TODAS as
-- duplicatas têm expressão idêntica, `(auth.uid() = user_id)`. Como políticas
-- PERMISSIVE se combinam por OR, duas regras iguais produzem o mesmo resultado
-- que uma só — não havia brecha. O risco que justificava a checagem seria uma
-- duplicata com `USING (true)`, que anularia as demais; não existia nenhuma.
--
-- O objetivo aqui é legibilidade: quem abrir o banco depois não deve precisar
-- descobrir qual das duas regras vale.
--
-- CRITÉRIO DE ESCOLHA: mantemos o conjunto que vem das migrations versionadas
-- (`enable_rls_missing_tables.sql` → "own rows *", `enable_rls_policies.sql` →
-- "...their own transactions"). O conjunto removido nasceu fora do Git e não
-- teria como ser recriado a partir do repositório.
--
-- Rode no SQL Editor do Supabase. Idempotente (DROP ... IF EXISTS).
-- Depois, confira que cada tabela caiu para 4 políticas (users segue com 3).
-- ============================================================

BEGIN;

-- clients / events: mantém "own rows *"
DROP POLICY IF EXISTS "Users can view their own clients"   ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

DROP POLICY IF EXISTS "Users can view own events"   ON public.events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

-- finance_*: mantém "own rows *"
DROP POLICY IF EXISTS finance_accounts_sel ON public.finance_accounts;
DROP POLICY IF EXISTS finance_accounts_ins ON public.finance_accounts;
DROP POLICY IF EXISTS finance_accounts_upd ON public.finance_accounts;
DROP POLICY IF EXISTS finance_accounts_del ON public.finance_accounts;

DROP POLICY IF EXISTS finance_cards_sel ON public.finance_cards;
DROP POLICY IF EXISTS finance_cards_ins ON public.finance_cards;
DROP POLICY IF EXISTS finance_cards_upd ON public.finance_cards;
DROP POLICY IF EXISTS finance_cards_del ON public.finance_cards;

DROP POLICY IF EXISTS finance_categories_sel ON public.finance_categories;
DROP POLICY IF EXISTS finance_categories_ins ON public.finance_categories;
DROP POLICY IF EXISTS finance_categories_upd ON public.finance_categories;
DROP POLICY IF EXISTS finance_categories_del ON public.finance_categories;

DROP POLICY IF EXISTS finance_limits_select_own ON public.finance_limits;
DROP POLICY IF EXISTS finance_limits_insert_own ON public.finance_limits;
DROP POLICY IF EXISTS finance_limits_update_own ON public.finance_limits;
DROP POLICY IF EXISTS finance_limits_delete_own ON public.finance_limits;

DROP POLICY IF EXISTS finance_tags_sel ON public.finance_tags;
DROP POLICY IF EXISTS finance_tags_ins ON public.finance_tags;
DROP POLICY IF EXISTS finance_tags_upd ON public.finance_tags;
DROP POLICY IF EXISTS finance_tags_del ON public.finance_tags;

DROP POLICY IF EXISTS focus_logs_sel ON public.focus_logs;
DROP POLICY IF EXISTS focus_logs_ins ON public.focus_logs;
DROP POLICY IF EXISTS focus_logs_upd ON public.focus_logs;
DROP POLICY IF EXISTS focus_logs_del ON public.focus_logs;

-- finance_transactions: aqui o par versionado é o "...their own transactions"
-- (enable_rls_policies.sql), então cai o "...their own finance".
DROP POLICY IF EXISTS "Users can view their own finance"   ON public.finance_transactions;
DROP POLICY IF EXISTS "Users can insert their own finance" ON public.finance_transactions;
DROP POLICY IF EXISTS "Users can update their own finance" ON public.finance_transactions;
DROP POLICY IF EXISTS "Users can delete their own finance" ON public.finance_transactions;

COMMIT;

-- ------------------------------------------------------------
-- Verificação: toda tabela deve ficar com 4 políticas (users com 3)
-- ------------------------------------------------------------
-- SELECT c.relname AS tabela, c.relrowsecurity AS rls_ativo, count(p.polname) AS politicas
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- LEFT JOIN pg_policy p ON p.polrelid = c.oid
-- WHERE n.nspname = 'public' AND c.relkind = 'r'
-- GROUP BY c.relname, c.relrowsecurity
-- ORDER BY c.relrowsecurity, count(p.polname), c.relname;
