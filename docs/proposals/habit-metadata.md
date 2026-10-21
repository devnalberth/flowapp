# Persistência de metadados do hábito

Aplicada no FlowApp (`loxxsngnsuvuujxxigyw`) em 21/10/2026, versão `20261021140637`, após a instrução para continuar o desenvolvimento sem solicitar aprovação.

Corrige o problema explicitamente listado na seção 11 do handoff: descrição e horário do formulário eram descartados pelo serviço; o ícone também não era persistido. A alteração adiciona somente `description` (text), `ideal_time` (time sem fuso) e `icon_id` (text), todos opcionais. Registros existentes recebem NULL, sem backfill ou alterações em conclusões, frequências e timer.

O serviço traduz `time` e `iconId` para os nomes do banco, devolve o horário em HH:mm e mantém os aliases existentes. Atualizações parciais omitem metadados ausentes; valores vazios limpam os campos. O ícone de registros antigos usa o fallback existente `sparkles`.

Verificação por catálogo: os três campos existem, são opcionais e a tabela mantém RLS habilitada. Teste de contrato em memória: criar → ler → editar → ler, limpeza dos campos, atualização parcial e filtros de proprietário. Não houve escrita em registros reais. O fluxo com usuário autenticado permanece pendente.

Não inclui lembretes ou associação de hábitos a metas (seção 10.2). O arquivo SQL nesta pasta é uma cópia de auditoria de uma migration já aplicada, não uma segunda migration a executar.
