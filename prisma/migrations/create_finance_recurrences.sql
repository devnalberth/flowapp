-- Recorrências financeiras (despesas/receitas fixas mensais)
-- Rodar no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS finance_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'DESPESA',           -- DESPESA | RECEITA
  category TEXT,                                   -- slug da categoria
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  card_id UUID REFERENCES finance_cards(id) ON DELETE SET NULL,
  payment_method TEXT,
  day_of_month INT NOT NULL DEFAULT 1,             -- dia do vencimento (1-31, ajustado ao fim do mês)
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_generated TEXT,                             -- último mês gerado ('YYYY-MM'); evita duplicar lançamentos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_finance_recurrences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_finance_recurrences_user_id ON finance_recurrences(user_id);

ALTER TABLE finance_recurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own finance recurrences" ON finance_recurrences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own finance recurrences" ON finance_recurrences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own finance recurrences" ON finance_recurrences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own finance recurrences" ON finance_recurrences FOR DELETE USING (auth.uid() = user_id);

-- Backfill: transações passadas são registros históricos → marcar como pagas.
-- (O fluxo de "contas a pagar" considera apenas lançamentos com paid = false;
-- sem este backfill, todo o histórico apareceria como pendente.)
UPDATE finance_transactions SET paid = TRUE WHERE date < NOW();
