# 🔒 GUIA: Como Habilitar RLS no Supabase

## ⚠️ PROBLEMA IDENTIFICADO
O erro "RLS Disabled in Public" no Supabase está impedindo que os dados sejam salvos permanentemente no banco.

## ✅ SOLUÇÃO: Executar Migração SQL

### PASSO 1: Abrir SQL Editor no Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto FlowApp
3. No menu lateral, clique em **"SQL Editor"**

### PASSO 2: Criar Nova Query
1. Clique no botão **"New query"** (canto superior direito)
2. Dê um nome: `Enable RLS Policies`

### PASSO 3: Copiar e Executar o SQL
1. Abra o arquivo: `prisma/migrations/enable_rls_policies.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione Ctrl/Cmd + Enter)

### PASSO 4: Verificar Sucesso
Você deverá ver:
```
Success. No rows returned
```

Se aparecer algum erro, copie a mensagem e me envie.

### PASSO 5: Confirmar RLS Habilitado
1. Vá em **"Table Editor"** no Supabase
2. Selecione qualquer tabela (ex: `tasks`)
3. Clique na aba **"RLS policies"**
4. Você deve ver 4 políticas:
   - ✅ Users can view their own tasks
   - ✅ Users can insert their own tasks
   - ✅ Users can update their own tasks
   - ✅ Users can delete their own tasks

## 📊 O QUE SERÁ CORRIGIDO

Após executar a migração, as seguintes tabelas terão RLS habilitado:

| Tabela | Políticas Criadas |
|--------|-------------------|
| ✅ users | 2 políticas (SELECT, UPDATE) |
| ✅ finance_transactions | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ study_items | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ study_modules | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ study_lessons | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ projects | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ tasks | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ goals | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ habits | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |
| ✅ dream_maps | 4 políticas (SELECT, INSERT, UPDATE, DELETE) |

## 🎯 COMO AS POLÍTICAS FUNCIONAM

Cada usuário só pode:
- **Ver** seus próprios dados
- **Criar** dados associados ao seu user_id
- **Editar** seus próprios dados
- **Deletar** seus próprios dados

## 🚀 APÓS EXECUTAR

1. Recarregue sua aplicação FlowApp
2. Tente criar uma tarefa/meta/projeto
3. Recarregue a página - os dados devem permanecer!

## ❓ SE DER ERRO

Possíveis erros e soluções:

### Erro: "policy already exists"
- Significa que algumas políticas já existem
- Solução: Ignore o erro, continue executando

### Erro: "permission denied"
- Você precisa ser admin do projeto Supabase
- Solução: Faça login com a conta correta

### Erro: "relation does not exist"
- Uma tabela pode não existir
- Solução: Verifique se todas as tabelas foram criadas corretamente
