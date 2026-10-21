-- APLICADA: migration add_event_type / 20261021133950. Nao executar novamente.
-- Registro definitivo: prisma/migrations/20261021133950_add_event_type.sql.
-- Projeto confirmado em leitura: FlowApp / loxxsngnsuvuujxxigyw.
-- Adiciona apenas o tipo do evento. Registros existentes ficam como Padrao;
-- nao tenta inferir categorias pelo titulo ou pela cor. RLS permanece intacto.
BEGIN;
ALTER TABLE public.events
  ADD COLUMN type text NOT NULL DEFAULT 'default'
  CONSTRAINT events_type_check CHECK (type IN ('default', 'event', 'meeting', 'workout'));
COMMIT;

-- Verificacao depois de aplicar:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'type';
-- Rollback (descarta somente os tipos registrados apos a migracao):
-- ALTER TABLE public.events DROP COLUMN type;
