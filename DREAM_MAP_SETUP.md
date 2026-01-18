# Configuração do Mapa dos Sonhos

Este documento contém as instruções para configurar o recurso de Mapa dos Sonhos no Supabase.

## 1. Criar a tabela dream_maps

Execute o SQL em `prisma/migrations/create_dream_maps.sql` no Supabase SQL Editor:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New query**
4. Cole o conteúdo do arquivo `create_dream_maps.sql`
5. Clique em **Run** para executar

## 2. Criar o bucket de storage

Para armazenar as imagens do mapa dos sonhos:

1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Clique em **New bucket**
4. Configure:
   - **Name**: `dream-maps`
   - **Public bucket**: ✅ (marcar como público)
   - **File size limit**: 5 MB (ou conforme necessário)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

5. Após criar o bucket, configure as políticas de acesso:

```sql
-- Policy para permitir que usuários autenticados façam upload
CREATE POLICY "Users can upload dream map images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dream-maps' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy para permitir que todos vejam as imagens (bucket público)
CREATE POLICY "Anyone can view dream map images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dream-maps');

-- Policy para permitir que usuários deletem suas próprias imagens
CREATE POLICY "Users can delete their own dream map images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dream-maps' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. Funcionalidades

Após a configuração, o Mapa dos Sonhos permite:

- ✅ Adicionar imagens com título
- ✅ Conectar imagens a metas específicas (opcional)
- ✅ Visualizar todas as imagens em um grid
- ✅ Deletar imagens do mapa
- ✅ Upload seguro com validação de usuário
- ✅ Armazenamento organizado por pasta de usuário

## 4. Estrutura dos dados

### Tabela: dream_maps

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | ID único (UUID) |
| title | TEXT | Título da imagem |
| goal_id | TEXT | ID da meta relacionada (opcional) |
| image_url | TEXT | URL da imagem no Storage |
| user_id | TEXT | ID do usuário proprietário |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

### Storage: dream-maps

Estrutura de pastas:
```
dream-maps/
  └── {user_id}/
      ├── {timestamp_1}.jpg
      ├── {timestamp_2}.png
      └── ...
```

## 5. Verificação

Para verificar se tudo está funcionando:

1. Faça login no aplicativo
2. Vá para a página de Metas
3. Role até a seção "Mapa dos sonhos"
4. Clique em "Adicionar imagem"
5. Selecione uma imagem, adicione um título e (opcionalmente) conecte a uma meta
6. Clique em "Adicionar"
7. A imagem deve aparecer no grid

## Segurança

- ✅ Row Level Security (RLS) ativado na tabela
- ✅ Usuários só podem ver/editar/deletar seus próprios registros
- ✅ Imagens organizadas por pasta de usuário no Storage
- ✅ Políticas de Storage garantem que usuários só possam modificar suas próprias imagens
