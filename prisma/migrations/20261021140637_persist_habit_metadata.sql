-- Correção da seção 11 do FLOWAPP-REDESIGN.md.
-- Somente metadados já presentes na interface; não inclui lembrete nem vínculo com metas.
ALTER TABLE public.habits
  ADD COLUMN description text,
  ADD COLUMN ideal_time time without time zone,
  ADD COLUMN icon_id text;
