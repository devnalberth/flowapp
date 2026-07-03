-- ============================================================
-- RLS PARA AS TABELAS QUE FICARAM FORA DE enable_rls_policies.sql
-- ============================================================
-- Auditoria de segurança (jul/2026): estas 8 tabelas são usadas pelo app
-- mas não tinham NENHUMA política no repositório. Sem RLS habilitado,
-- qualquer pessoa com a anon key (que é pública por definição numa SPA)
-- pode ler e escrever TODOS os registros de TODOS os usuários via PostgREST.
-- O filtro .eq('user_id', ...) no cliente é só conveniência — a fronteira
-- de segurança real é o RLS.
--
-- Rode no SQL Editor do Supabase. Idempotente (pode rodar mais de uma vez).

-- Helper: aplica o conjunto padrão de políticas "dono da linha" a uma tabela
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'clients',            -- dados de clientes (nome, e-mail, telefone, notas)
    'events',             -- compromissos
    'finance_accounts',   -- contas bancárias
    'finance_cards',      -- cartões de crédito
    'finance_categories', -- categorias financeiras
    'finance_limits',     -- limites de gastos
    'finance_tags',       -- tags financeiras
    'focus_logs'          -- histórico do timer de foco
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Só aplica se a tabela existir neste banco
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      EXECUTE format('DROP POLICY IF EXISTS "own rows select" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "own rows select" ON public.%I FOR SELECT USING (auth.uid() = user_id::uuid)', t);

      EXECUTE format('DROP POLICY IF EXISTS "own rows insert" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "own rows insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id::uuid)', t);

      EXECUTE format('DROP POLICY IF EXISTS "own rows update" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "own rows update" ON public.%I FOR UPDATE USING (auth.uid() = user_id::uuid) WITH CHECK (auth.uid() = user_id::uuid)', t);

      EXECUTE format('DROP POLICY IF EXISTS "own rows delete" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "own rows delete" ON public.%I FOR DELETE USING (auth.uid() = user_id::uuid)', t);

      RAISE NOTICE 'RLS aplicado em public.%', t;
    ELSE
      RAISE NOTICE 'Tabela public.% não existe neste banco — ignorada', t;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- STORAGE: uploads restritos à pasta do próprio usuário
-- ============================================================
-- Os buckets 'dream-maps' e 'study-covers' guardam arquivos em
-- "<user_id>/<timestamp>.<ext>". Estas políticas garantem que cada usuário
-- só consegue subir/alterar/apagar arquivos DENTRO da própria pasta.
-- (A leitura pública das imagens permanece — o app usa getPublicUrl.
--  Para privacidade total, migrar o código para createSignedUrl e
--  desmarcar "Public bucket" no dashboard.)

DO $$
DECLARE
  b TEXT;
  buckets TEXT[] := ARRAY['dream-maps', 'study-covers'];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = b) THEN
      EXECUTE format('DROP POLICY IF EXISTS "own folder insert %s" ON storage.objects', b);
      EXECUTE format(
        'CREATE POLICY "own folder insert %s" ON storage.objects FOR INSERT TO authenticated
         WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b, b);

      EXECUTE format('DROP POLICY IF EXISTS "own folder update %s" ON storage.objects', b);
      EXECUTE format(
        'CREATE POLICY "own folder update %s" ON storage.objects FOR UPDATE TO authenticated
         USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b, b);

      EXECUTE format('DROP POLICY IF EXISTS "own folder delete %s" ON storage.objects', b);
      EXECUTE format(
        'CREATE POLICY "own folder delete %s" ON storage.objects FOR DELETE TO authenticated
         USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)', b, b);

      RAISE NOTICE 'Políticas de pasta própria aplicadas ao bucket %', b;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- VERIFICAÇÃO: liste qualquer tabela pública ainda SEM RLS
-- ============================================================
-- Resultado esperado após rodar este arquivo: nenhuma linha.
SELECT c.relname AS tabela_sem_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY 1;
