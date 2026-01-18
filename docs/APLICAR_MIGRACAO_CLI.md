# 🚀 Como Aplicar Migração RLS via CLI

## 📋 OPÇÕES DISPONÍVEIS

Existem 3 formas de aplicar a migração RLS no Supabase:

---

## ✅ OPÇÃO 1: Script Automatizado (RECOMENDADO)

### Passo 1: Configurar variáveis de ambiente

```bash
# Defina seu Project Reference ID
export SUPABASE_PROJECT_REF='seu-project-ref-aqui'

# Defina sua senha do banco de dados
export SUPABASE_DB_PASSWORD='sua-senha-aqui'
```

**Onde encontrar essas informações:**
- **Project Ref**: Supabase Dashboard → Settings → General → Reference ID
- **Database Password**: Supabase Dashboard → Settings → Database → Connection string

### Passo 2: Dar permissão ao script

```bash
chmod +x scripts/apply-rls-migration.sh
```

### Passo 3: Executar o script

```bash
./scripts/apply-rls-migration.sh
```

---

## ⚡ OPÇÃO 2: Via psql direto

Se você tem `psql` instalado:

```bash
# 1. Configure a senha
export PGPASSWORD='sua-senha-do-banco'

# 2. Execute a migração
psql "postgresql://postgres:sua-senha@db.seu-project-ref.supabase.co:5432/postgres" \
  -f prisma/migrations/enable_rls_policies.sql
```

---

## 🌐 OPÇÃO 3: Via Supabase Dashboard (Mais simples)

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Clique em **"New query"**
4. Copie TODO o conteúdo de `prisma/migrations/enable_rls_policies.sql`
5. Cole no editor e clique em **"Run"**

---

## 📊 Verificar se funcionou

Após executar qualquer método acima:

```bash
# Verificar se RLS está habilitado
psql "sua-connection-string" -c "
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'tasks', 'projects', 'goals', 'habits', 'finance_transactions')
ORDER BY tablename;
"
```

Deve mostrar `t` (true) na coluna `rowsecurity` para todas as tabelas.

---

## 🔧 Troubleshooting

### Erro: "psql: command not found"

**Solução**: Use a Opção 3 (Supabase Dashboard)

### Erro: "password authentication failed"

**Solução**: Verifique se a senha está correta em:
- Supabase Dashboard → Settings → Database → Reset database password

### Erro: "could not connect to server"

**Solução**: Verifique se o Project Ref está correto

---

## 🎯 Após aplicar

1. ✅ Recarregue o FlowApp
2. ✅ Crie uma tarefa/meta/projeto
3. ✅ Recarregue a página
4. ✅ Os dados devem permanecer!
