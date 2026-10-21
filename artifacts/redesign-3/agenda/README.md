# Agenda — Redesign 3.0

Implementação local em React/CSS sobre o shell existente. Sem novo roteador, dependências de runtime, alteração de cálculos financeiros ou de tabelas aplicada.

## Referências consultadas

Figma `8BETSzvCvZT1odD8o05jhL`, página `48412:153`. Cada frame foi aberto com `get_design_context`, `get_screenshot` e `get_motion_context` antes da implementação:

| Estado | Node | Print local |
| --- | --- | --- |
| Mês | `48435:4032` | `agenda-mes-1440.png` |
| Semana | `48437:4159` | `agenda-semana-1440.png` |
| Dia | `48438:4274` | `agenda-dia-1440.png` |
| Dia sem compromissos | `48439:6246` | `agenda-dia-vazio-1440.png` |
| Novo evento | `48439:4609` | `novo-evento.png` |
| Detalhe do evento | `48439:5745` | `detalhe-evento.png` |

As capturas usam fixtures artificiais em um harness separado, sem sessão autenticada e sem gravações no Supabase. Não representam dados reais nem validação em produção. O schema de `events` foi conferido em leitura no projeto FlowApp.

## Comportamento

- Agenda ligada à navegação por estado do `App.jsx` e à Sidebar existente.
- Mês de 4–6 semanas, seleção de dia, anterior/próximo e Hoje; seletor Mês/Semana/Dia e filtros de eventos/tarefas/contas.
- Semana começa no domingo. Datas de calendário permanecem literais; timestamps de tarefas usam a interpretação local do formulário existente, inclusive sentinelas de data sem horário.
- Tarefas arquivadas ficam fora. Concluídas permanecem na agenda do dia e na semana; os previews do mês priorizam as tarefas abertas. Blocos de tarefas têm tamanho visual fixo, sem inferir duração.
- Eventos usam início/fim armazenados; sem fim definido, o bloco possui altura visual de referência e não exibe duração inventada. Horários simultâneos dividem o espaço em faixas para preservar acesso a todos os registros.
- Contas usam os mesmos critérios de despesa pendente e os mesmos helpers de fatura corrente do `UpcomingBills`. Compras no cartão não são duplicadas como contas individuais; não há expansão nova de recorrências.
- Valores financeiros, inclusive títulos em texto, respeitam a preferência global de máscara.
- Checks de tarefa usam o mesmo payload existente de conclusão/reabertura. O cronômetro dentro da tarefa na Agenda foi omitido por orientação explícita do usuário; o status permanece. O timer existente não foi alterado nem tornado global.
- Fim, Dia inteiro e Lembrete foram expostos no formulário após autorização explícita para seguir os campos do Figma. São campos já presentes no banco e aceitos pelo serviço. Não foi criado serviço de notificações/agendador.
- Edição lê a data/hora reais do evento normalizado, com compatibilidade de leitura para `start_time` legado. O limite existente de descrição continua em 500 caracteres.
- Formulário, detalhe e exclusão usam Modal nativo, foco contido, Escape, retorno de foco, confirmação e feedback. Ações do menu permanecem dentro do dialog.
- Datas/horas usam controles nativos, cuja aparência e localização variam conforme o navegador/sistema.
- Motion de entrada executa uma vez, com tokens/presets existentes. Reduced motion mantém fade sem deslocamento. Skeleton local ocupa a mesma grade durante carregamento.

## Validação

`verification.json` registra os checks automatizados de geometria em 1440px, navegação/filtros, datas locais, máscara, payloads de conclusão e formulário, edição/exclusão, ano bissexto, mês de seis semanas, responsivo1100/900/390 e reduced motion. Prints em larguras menores também estão nesta pasta.

Harness e Playwright ficam fora do projeto em `/Users/nalberth/.cache/flowapp-redesign-qa`; não foram adicionadas dependências ao app. Build Vite e `git diff --check` conferidos. Permanecem os avisos preexistentes de módulos Node externalizados no SDK Anthropic e bundle grande.

## Pendência de backend

A coluna `events.type` não existe no schema consultado. A proposta `docs/proposals/agenda-event-type.sql` e o patch `docs/proposals/agenda-event-service.patch` aguardam aprovação explícita antes de aplicação. Até aplicar essa etapa, o Tipo enviado pelo formulário continua sendo descartado pelo serviço atual, assim como acontecia no formulário anterior. Não declarar a persistência de Tipo concluída antes dessa verificação.

O candidato do patch passou em testes em memória; criar → recarregar → editar → recarregar com uma sessão real permanece pendente. Nenhuma migration foi aplicada nesta entrega de interface.

A próxima tela do plano geral é Hábitos, após concluir a pendência de Tipo na Agenda.
