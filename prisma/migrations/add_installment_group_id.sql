-- ============================================================
-- Adiciona campos de agrupamento de parcelas em finance_transactions
-- Permite vincular todas as parcelas de uma mesma compra
-- ============================================================

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS installment_group_id UUID,
  ADD COLUMN IF NOT EXISTS installment_index INTEGER;

-- Índice para busca rápida por grupo de parcelas
CREATE INDEX IF NOT EXISTS idx_ft_installment_group_id
  ON public.finance_transactions(installment_group_id);

COMMENT ON COLUMN public.finance_transactions.installment_group_id IS
  'UUID compartilhado por todas as parcelas de uma mesma compra. NULL para transações não parceladas.';

COMMENT ON COLUMN public.finance_transactions.installment_index IS
  'Posição desta parcela no grupo (base 1). Ex: 1 = primeira parcela, 3 = terceira parcela.';
