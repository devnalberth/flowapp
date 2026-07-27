-- ============================================================
-- ESTUDOS: de (módulo → sub-módulo → matéria → aula)
--          para (módulo → sub-módulo), com contador de aulas
-- ============================================================
-- Motivação: o progresso era derivado de linhas individuais de aula, e o
-- agendamento/pomodoro vivia na aula. Na prática o estudo acontece por BLOCO
-- (um sub-módulo inteiro numa sessão), então a aula virou ruído: 149 linhas
-- para dizer "91% do módulo".
--
-- Modelo novo:
--   * study_modules com kind IN ('module','submodule'). Nada mais.
--   * Sub-módulo NUNCA tem filhos. Só módulo tem filhos.
--   * Cada bloco guarda lessons_total / lessons_done (contador, sem linhas).
--   * Progresso do módulo = soma dos filhos, se tiver filhos; senão o próprio contador.
--   * Agendamento (data/hora/prioridade → aba Tarefas) vive no bloco:
--     no módulo quando ele não tem sub-módulos, nos sub-módulos quando tem.
--
-- Rode no SQL Editor do Supabase. Idempotente (pode rodar mais de uma vez).
-- study_lessons NÃO é removida aqui — veja o passo 9, comentado de propósito.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Colunas novas em study_modules
-- ------------------------------------------------------------
ALTER TABLE public.study_modules
  ADD COLUMN IF NOT EXISTS lessons_total  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_done   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS scheduled_time text,
  ADD COLUMN IF NOT EXISTS priority       text,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS rating         integer,
  ADD COLUMN IF NOT EXISTS resources      jsonb DEFAULT '[]'::jsonb;

-- task_id e tasks.study_module_id: o tipo do id varia conforme como o banco foi
-- criado (text/cuid via Prisma ou uuid via Supabase), então derivamos do próprio
-- catálogo em vez de chutar.
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'study_modules' AND column_name = 'task_id'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.study_modules ADD COLUMN task_id %s REFERENCES public.tasks(id) ON DELETE SET NULL',
      task_id_type);
  END IF;

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

-- Coluna de rastro temporária: liga cada bloco criado nesta migração à aula que
-- lhe deu origem, para religar as tarefas no passo 7. Removida no passo 8.
ALTER TABLE public.study_modules ADD COLUMN IF NOT EXISTS _src_lesson_id text;

-- ------------------------------------------------------------
-- 2. Snapshot da estrutura ORIGINAL
-- ------------------------------------------------------------
-- Os passos seguintes criam e reposicionam linhas em study_modules. Sem um
-- retrato do "antes", a pergunta "este módulo tinha filhos?" mudaria de
-- resposta no meio da migração.
CREATE TEMP TABLE _orig_has_child ON COMMIT DROP AS
  SELECT DISTINCT parent_module_id AS id
  FROM public.study_modules
  WHERE parent_module_id IS NOT NULL;

-- ------------------------------------------------------------
-- 3. Aulas soltas em módulo raiz que TEM filhos → viram sub-módulos
-- ------------------------------------------------------------
-- Ex.: "DESAFIO PRÁTICO - LISTA DE COMPRAS" pendurado direto no módulo
-- JavaScript. Se virasse contador do módulo, o contador seria sobrescrito pela
-- soma dos filhos e o item sumiria da tela. Então cada uma vira um bloco.
INSERT INTO public.study_modules (
  study_item_id, parent_module_id, kind, title, description,
  lessons_total, lessons_done,
  scheduled_date, scheduled_time, priority, notes, rating, resources,
  _src_lesson_id
)
SELECT
  m.study_item_id,
  m.id,
  'submodule',
  l.title,
  l.description,
  1,
  CASE WHEN l.is_completed THEN 1 ELSE 0 END,
  l.scheduled_date,
  l.scheduled_time,
  l.priority,
  l.notes,
  l.rating,
  COALESCE(l.resources, '[]'::jsonb),
  l.id::text
FROM public.study_lessons l
JOIN public.study_modules m ON m.id = l.module_id
WHERE m.parent_module_id IS NULL
  AND m.id IN (SELECT id FROM _orig_has_child)
  -- reentrância: não recria blocos se a migração já rodou
  AND NOT EXISTS (
    SELECT 1 FROM public.study_modules x WHERE x._src_lesson_id = l.id::text
  );

-- ------------------------------------------------------------
-- 4. Matéria (kind='subject') → sub-módulo
-- ------------------------------------------------------------
-- Matéria que morava dentro de um sub-módulo sobe um nível e vira irmã dele,
-- pendurada no módulo (o modelo novo só admite 2 níveis). O título é preservado.
UPDATE public.study_modules child
SET parent_module_id = parent.parent_module_id
FROM public.study_modules parent
WHERE child.parent_module_id = parent.id
  AND parent.parent_module_id IS NOT NULL;

UPDATE public.study_modules
SET kind = 'submodule'
WHERE parent_module_id IS NOT NULL
  AND (kind IS DISTINCT FROM 'submodule');

UPDATE public.study_modules
SET kind = 'module'
WHERE parent_module_id IS NULL
  AND (kind IS DISTINCT FROM 'module');

-- ------------------------------------------------------------
-- 5. Aulas restantes → contador do bloco onde estavam
-- ------------------------------------------------------------
-- "Aulas restantes" = tudo que não virou bloco próprio no passo 3.
WITH tally AS (
  SELECT
    l.module_id,
    COUNT(*)::int                                        AS total,
    COUNT(*) FILTER (WHERE l.is_completed)::int          AS done,
    ROUND(AVG(l.rating) FILTER (WHERE l.rating > 0))::int AS avg_rating,
    -- notas escritas à mão são conteúdo do usuário: concatena em vez de descartar
    NULLIF(string_agg(
      '### ' || l.title || E'\n' || l.notes,
      E'\n\n' ORDER BY l.created_at
    ) FILTER (WHERE NULLIF(TRIM(l.notes), '') IS NOT NULL), '')  AS merged_notes,
    COALESCE(
      jsonb_agg(r) FILTER (WHERE r IS NOT NULL),
      '[]'::jsonb
    ) AS merged_resources
  FROM public.study_lessons l
  LEFT JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(l.resources) = 'array' THEN l.resources ELSE '[]'::jsonb END
  ) AS r ON TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.study_modules x WHERE x._src_lesson_id = l.id::text
  )
  GROUP BY l.module_id
)
UPDATE public.study_modules m
SET lessons_total = tally.total,
    lessons_done  = tally.done,
    rating        = COALESCE(m.rating, NULLIF(tally.avg_rating, 0)),
    notes         = COALESCE(NULLIF(TRIM(m.notes), ''), tally.merged_notes),
    resources     = CASE
                      WHEN jsonb_array_length(COALESCE(m.resources, '[]'::jsonb)) > 0
                        THEN m.resources
                      ELSE tally.merged_resources
                    END
FROM tally
WHERE m.id = tally.module_id
  -- só preenche contador ainda zerado, para a migração poder rodar de novo
  AND m.lessons_total = 0;

-- ------------------------------------------------------------
-- 6. Módulo com filhos não guarda contador próprio
-- ------------------------------------------------------------
-- Seu progresso passa a ser a soma dos sub-módulos. Zerar evita contagem dupla.
UPDATE public.study_modules m
SET lessons_total = 0, lessons_done = 0
WHERE m.parent_module_id IS NULL
  AND EXISTS (SELECT 1 FROM public.study_modules c WHERE c.parent_module_id = m.id);

-- ------------------------------------------------------------
-- 7. Religar as tarefas: aula → bloco
-- ------------------------------------------------------------
-- 7a. Aulas que viraram bloco próprio: a tarefa passa a apontar para o bloco.
UPDATE public.tasks t
SET study_module_id = m.id,
    study_lesson_id = NULL
FROM public.study_modules m
WHERE m._src_lesson_id = t.study_lesson_id::text
  AND t.study_lesson_id IS NOT NULL;

UPDATE public.study_modules m
SET task_id = t.id
FROM public.tasks t
WHERE t.study_module_id = m.id
  AND m._src_lesson_id IS NOT NULL
  AND m.task_id IS NULL;

-- 7b. Aulas que viraram contador: a tarefa sobrevive e mantém o contexto do
-- curso, apontando para o bloco que absorveu a aula. Nenhuma tarefa é apagada.
UPDATE public.tasks t
SET study_module_id = l.module_id,
    study_lesson_id = NULL
FROM public.study_lessons l
WHERE t.study_lesson_id = l.id
  AND t.study_module_id IS NULL;

-- 7c. O bloco adota como agendamento próprio a MAIS PRÓXIMA das datas que
-- absorveu. As demais tarefas continuam listadas nas Tarefas, mas o bloco não
-- as gerencia (desagendar o bloco remove só a tarefa dele).
WITH earliest AS (
  SELECT DISTINCT ON (t.study_module_id)
    t.study_module_id AS module_id,
    t.id              AS task_id,
    t.due_date
  FROM public.tasks t
  WHERE t.study_module_id IS NOT NULL
    AND t.due_date IS NOT NULL
    AND t.completed IS NOT TRUE
  ORDER BY t.study_module_id, t.due_date ASC
)
UPDATE public.study_modules m
SET task_id        = earliest.task_id,
    scheduled_date = earliest.due_date::date,
    scheduled_time = CASE
                       WHEN earliest.due_date::time <> '00:00:00'
                         THEN to_char(earliest.due_date::time, 'HH24:MI')
                       ELSE m.scheduled_time
                     END
FROM earliest
WHERE m.id = earliest.module_id
  AND m.task_id IS NULL;

-- ------------------------------------------------------------
-- 8. Limpeza
-- ------------------------------------------------------------
ALTER TABLE public.study_modules DROP COLUMN IF EXISTS _src_lesson_id;

-- Prioridade padrão para blocos que herdaram agendamento sem prioridade
UPDATE public.study_modules
SET priority = 'Normal'
WHERE scheduled_date IS NOT NULL AND (priority IS NULL OR TRIM(priority) = '');

COMMIT;

-- ------------------------------------------------------------
-- 9. Remoção da tabela de aulas — RODAR SÓ DEPOIS DE CONFERIR
-- ------------------------------------------------------------
-- A tabela fica de pé de propósito: é a única cópia dos dados de origem caso
-- algum contador tenha saído errado. Confira na tela que os números batem
-- (módulo JavaScript deve seguir em 61/67 · 91%) e só então rode:
--
--   ALTER TABLE public.tasks DROP COLUMN IF EXISTS study_lesson_id;
--   DROP TABLE IF EXISTS public.study_lessons;
