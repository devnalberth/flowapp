-- ============================================================
-- ESTUDOS: módulos e sub-módulos podem ir para as Tarefas
-- ============================================================
-- Antes, só a aula tinha data e virava tarefa. Quem não quer cadastrar aula por
-- aula ficava sem nenhuma forma de agendar o estudo ou medir o tempo.
--
-- Agora qualquer bloco (módulo ou sub-módulo) pode:
--   * ser agendado (scheduled_date/time + priority) e espelhar uma Task;
--   * ser marcado como concluído (is_completed) quando não tem aulas dentro.
--
-- MIGRAÇÃO PURAMENTE ADITIVA: só ADD COLUMN. Nenhuma linha é alterada,
-- convertida ou removida. Aulas, matérias e sub-módulos existentes seguem
-- funcionando exatamente como estão.
--
-- Rode no SQL Editor do Supabase. Idempotente (pode rodar mais de uma vez).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Agendamento e conclusão no bloco
-- ------------------------------------------------------------
ALTER TABLE public.study_modules
  ADD COLUMN IF NOT EXISTS is_completed   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS scheduled_time text,
  ADD COLUMN IF NOT EXISTS priority       text;

-- ------------------------------------------------------------
-- 2. Vínculo bloco <-> tarefa
-- ------------------------------------------------------------
-- O tipo do id varia conforme como o banco foi criado (text/cuid via Prisma ou
-- uuid via Supabase), então derivamos do catálogo em vez de chutar.
DO $$
DECLARE
  mod_id_type  text;
  task_id_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO mod_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.study_modules'::regclass AND a.attname = 'id';

  SELECT format_type(a.atttypid, a.atttypmod) INTO task_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.tasks'::regclass AND a.attname = 'id';

  -- Tarefa-espelho do bloco agendado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'study_modules' AND column_name = 'task_id'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.study_modules ADD COLUMN task_id %s REFERENCES public.tasks(id) ON DELETE SET NULL',
      task_id_type);
  END IF;

  -- Caminho inverso: da tarefa de volta para o bloco que a gerou
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'study_module_id'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.tasks ADD COLUMN study_module_id %s REFERENCES public.study_modules(id) ON DELETE CASCADE',
      mod_id_type);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tasks_study_module_id_idx ON public.tasks (study_module_id);

COMMIT;
