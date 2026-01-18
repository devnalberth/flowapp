#!/bin/bash

# ============================================
# Script para aplicar migração RLS via Supabase CLI
# ============================================

echo "🔒 Aplicando políticas de RLS no Supabase..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_PROJECT_REF não está configurada${NC}"
    echo ""
    echo "Para configurar, execute:"
    echo -e "${GREEN}export SUPABASE_PROJECT_REF='seu-project-ref'${NC}"
    echo ""
    echo "Encontre seu Project Ref em:"
    echo "https://supabase.com/dashboard → Seu Projeto → Settings → General → Reference ID"
    echo ""
    exit 1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_DB_PASSWORD não está configurada${NC}"
    echo ""
    echo "Para configurar, execute:"
    echo -e "${GREEN}export SUPABASE_DB_PASSWORD='sua-senha-do-banco'${NC}"
    echo ""
    echo "Encontre sua senha em:"
    echo "https://supabase.com/dashboard → Seu Projeto → Settings → Database → Connection string"
    echo ""
    exit 1
fi

# Construir connection string
DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"

echo "📋 Aplicando migração: enable_rls_policies.sql"
echo ""

# Aplicar migração usando psql
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "$DB_URL" -f prisma/migrations/enable_rls_policies.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migração aplicada com sucesso!${NC}"
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Recarregue sua aplicação FlowApp"
    echo "2. Tente criar uma tarefa/meta/projeto"
    echo "3. Recarregue a página - os dados devem permanecer!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Erro ao aplicar migração${NC}"
    echo ""
    echo "Tente aplicar manualmente via Supabase Dashboard:"
    echo "https://supabase.com/dashboard → SQL Editor → Cole o conteúdo de enable_rls_policies.sql"
    echo ""
    exit 1
fi
