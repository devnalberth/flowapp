# Agenda — persistência do tipo de evento

Aplicada após a autorização do usuário para continuar sem solicitar aprovações. Migration remota `add_event_type`, versão `20261021133950`, registrada em `prisma/migrations/20261021133950_add_event_type.sql`. O patch foi aplicado ao serviço.

Consulta somente de leitura ao projeto FlowApp (`loxxsngnsuvuujxxigyw`) confirmou os campos `end_time`, `is_all_day` e `reminder_minutes`, mas não existe `type` em `public.events`. Os controles Fim, Dia inteiro e Lembrete usam os campos já aceitos pelo serviço. O Tipo do formulário antigo já era enviado pelo componente e descartado pelo serviço.

## Alteração proposta

- Executar `agenda-event-type.sql`: adicionar `events.type`, texto obrigatório, padrão `default`, limitado a `default`, `event`, `meeting`, `workout`.
- Eventos existentes ficam como Padrão. Não inferir tipos por título ou cor.
- Aplicar `agenda-event-service.patch`: incluir o campo em INSERT/UPDATE, mantendo os filtros por usuário e os normalizadores atuais. Usar `?? 30` para não substituir um lembrete já configurado como zero pelo valor padrão.
- Manter políticas RLS, autenticação, tabelas e os demais campos atuais.

A coluna obrigatória com padrão `default`, a constraint das quatro opções e RLS ativo foram verificados no projeto FlowApp após aplicação. Os testes de contrato passaram no serviço real do código, com cliente em memória. A validação autenticada deve confirmar criar → recarregar → editar → recarregar com o Tipo preservado.

## Validação já feita

O patch foi aplicado sem conflito (conferido antes com `git apply --check`). O candidato do serviço passou por testes em memória de criação, edição, atualização sem Tipo, lembrete zero, normalização e filtro do dono. Nenhuma criação, edição ou exclusão de evento real foi feita durante os testes; somente a migration de schema foi aplicada. Os testes de interface utilizam fixtures locais e não comprovam persistência real no banco.

O rollback do SQL descarta somente os valores da nova coluna. Está comentado no arquivo para revisão; não deve ser executado automaticamente.
