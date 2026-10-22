# Projetos — Redesign 3.0 (em andamento)

Referências do arquivo Figma `8BETSzvCvZT1odD8o05jhL`, página `48412:153`:

| Tela | nodeId | Captura |
|---|---|---|
| Galeria | 48470:2 | projetos-galeria-1440.png |
| Arquivados | 48471:13288 | projetos-arquivados-1440.png |
| Visão geral | 48473:2 | projeto-visao-geral-1440.png |
| Kanban | 48474:241 | projeto-kanban-1440.png |
| Lista | 48475:265 | projeto-lista-1440.png |
| Calendário | 48475:860 | projeto-calendario-1440.png |
| Sem projetos | 48477:953 | projetos-vazio-1440.png |
| Menu de ações | 48471:13932 | projeto-menu-1440.png |
| Novo projeto | 48476:2 | projeto-formulario-1440.png |
| Novo cliente | 48476:604 | projeto-cliente-1440.png |
| Excluir projeto | 48477:2 | projeto-exclusao-1440.png |
| Arquivar + Desfazer | 48477:353 | projeto-arquivar-1440.png |

Galeria retornou contexto esparso. Foram consultados os contextos completos dos filhos Header (48470:6), herói (48470:9), KPI (48470:43), prazos (48471:373), categorias (48470:827) e card (48471:492), além dos screenshots e motion. Componentes compartilhados HeroCard/HeroRings, KpiCard, CardHeader, FilterPill, StatusBadge, ProgressRing, ActionMenu e EmptyState. Motion de entrada sem loop, com movimento reduzido.

## Escopo deste avanço

- Galeria com herói de progresso médio, distribuição por status, quatro KPIs, quatro próximos prazos, filtros por área, cards e atalho de criação. Arquivados ficam fora do painel e mantêm restauração pelo handler existente.
- Cores dos seis valores persistidos mapeadas para tokens apenas na apresentação (`projectAppearance.js`). Nenhum valor de cor gravado foi alterado.
- Skeleton com as dimensões da galeria e estado de categoria sem resultado no design compartilhado.
- Máscara global cobre títulos de projetos, clientes e metas com valores monetários nesta apresentação.
- Dados das capturas são sintéticos no harness externo ao repositório; a tela real usa o AppContext existente.

## Regras preservadas / conflitos registrados

Comparação AST confirmou 20 cálculos/handlers originais: filtros, contagens, projeto ativo, criação/edição/exclusão, tarefas, clientes, arquivar/restaurar, cálculo completo do dashboard e datas dos cards.

`projectMetrics.js`, services, AppContext e migrations não foram modificados. A associação de tarefas por título e o auto-sync de status continuam como estavam. A seção 11 pede corrigir esses dois pontos, mas isso altera comportamento e fica separado do re-skin. Status manual da seção 10.2 continua adiado.

O aviso de Arquivados omite “fora das metas”: o código de Metas atualmente inclui projetos arquivados no agregado. Não mudamos essa regra para fazer o texto coincidir com o Figma. Datas de arquivamento e conclusão não são armazenadas; omitidas das telas. Os KPIs usam todos os projetos ativos retornados, sem inventar um filtro anual ou uma data de conclusão.

As setas dos KPIs que sugeririam filtros de status inexistentes foram omitidas. Tarefas pendentes navega para a página existente de Tarefas; herói/prazos/cards abrem o workspace existente. A galeria mantém as métricas globais mesmo com categoria selecionada, como antes.

Prazos até 10 dias usam a apresentação âmbar do handoff; cálculo de dias, ordenação e limite de quatro permanecem iguais. Restaurar mantém a gravação de `todo`, seguida pelo auto-sync existente; não foi introduzida uma nova política de status.

## Verificação local

`browser-verification.json`: 11 verificações de métricas, filtros, categoria vazia, máscara, navegação, criação, restauração, fallback após restaurar o último arquivado, 1024/390px, skeleton, movimento reduzido e ausência de erros de runtime.

Geometria desktop: herói 548×306 em (288,200); prazos 1112×159 em (288,522); galeria com três colunas de 360px, gap 16. Capturas adicionais em 1024px e 390px. Build e diff check passam. Permanecem avisos anteriores do SDK Anthropic e bundle grande.

Harness com callbacks e estado sintéticos; requisições Supabase bloqueadas. Nenhuma escrita real autenticada ou deployment foi verificado.

## Próximas unidades

Referências visuais de Projetos e seus cinco fluxos implementadas. Próximo módulo na seção 12: Estudos, sem caderno. A função de status manual persistente continua adiada para a seção 10.2. O alerta nativo de falha ao criar tarefa a partir de Projetos foi preservado nesta unidade; ele pertence ao fluxo compartilhado de criação de tarefas. Não foram alterados AppContext, services ou migrations.

## Visão geral — 48473:2

Implementada com tokens e componentes compartilhados: cabeçalho, ações existentes, andamento, tempo decorrido, KPIs, abas, detalhes, cliente e descrição. Comparação de tempo usa apenas datas existentes; meta financeira reutiliza categoryRevenue para o mês corrente. Nenhuma gravação adicional. Sem timestamps de conclusão, o contexto mostra “tarefas do projeto”, evitando uma data inventada. Ausência de cliente, prazo, descrição ou meta tem apresentação condicional.

Capturas projeto-visao-geral-1440/1024/390.png. Herói 548×306 em (288,220.6), painéis 548×347 em y601.6. overview-verification.json registra oito verificações locais. Build passou e os 20 cálculos/handlers da galeria continuam iguais por AST. O workspace ainda abre em Kanban, como antes; os modais permanecem pendentes. Nenhuma validação autenticada de backend ou deployment nesta unidade.

## Kanban — 48474:241

Re-skin das três colunas existentes, com cabeçalho compartilhado com Visão geral, PriorityTag e cards de tarefas. Exibe quatro concluídas inicialmente; o contador revela as demais sem mudar o conjunto de tarefas. O destaque tracejado existe somente durante drag-over real. O frame do Figma demonstra uma tarefa arrastada; não é uma tarefa duplicada permanente. Cronômetro em foco omitido porque o timer existente pertence à página Tarefas. Datas de conclusão só aparecem quando disponíveis, sem inventar timestamps.

Sete verificações em kanban-verification.json: contagens, expansão, payload de drop idêntico, no-op no mesmo status, navegação entre abas, 1024/390px e criação por coluna. Comparação AST adicional confirma oito cálculos/handlers do workspace, incluindo byColumn e handleDrop, sem alterações. Capturas projeto-kanban-1440/1024/390.png. Oito verificações da Visão geral passaram novamente após compartilhar o cabeçalho. Backend autenticado não exercitado; callbacks sintéticos registraram os payloads.

## Lista — 48475:265

Tabela semântica com checks de 40px, PriorityTag, StatusBadge e destaque para prazo de hoje. Em telas estreitas, as linhas exibem rótulos junto aos valores. A ordenação original mantém A fazer antes de Em andamento, apesar da ordem diferente na referência. A coluna Prazo continua usando due_date; não substitui prazo por data de conclusão. Sem prazo, exibe travessão. A apresentação de prioridade nas concluídas segue o Figma.

Oito verificações em list-verification.json: 13 tarefas e ordenação, conclusão por teclado, reabertura, payloads e atualização visível no estado sintético, prazo ausente, destaque Hoje, privacidade, 1024/390px, movimento reduzido e lista vazia.

## Calendário — 48475:860

Card principal 740×484 e lateral 356×484 em desktop, seleção em tinta, hoje com contorno Brasa e marcadores de status. Preserva o calendário baseado em due_date, o mês inicial atual, a seleção inicialmente vazia e o reset de seleção ao mudar mês. A legenda usa “Concluída”, pois a posição representa o prazo, não a data de conclusão. Indicador de conclusão na lateral é somente visual: não adicionamos a ação de concluir a esta visão.

Oito verificações em calendar-verification.json cobrem dias e alinhamento do mês, tarefa selecionada, hoje local, dia vazio, troca de mês, teclado, ausência de escritas, responsividade e movimento reduzido. Comparação AST confirmou 14 cálculos/handlers do workspace preservados, incluindo o useMemo do calendário, cursor, seleção e shift. As células vazias não recebem o destaque de seleção quando selected é null.

## Sem projetos — 48477:953

Card 1112×404 em (288,200), ícone FolderKanban, texto e três passos do Figma. CTA usa o formulário de criação existente; condição de exibição permanece igual. Três verificações em empty-verification.json: estado sem painel/filtros, CTA e Escape, layouts 1024/390px.

Validação destas três telas é local, com dados sintéticos e Supabase bloqueado. Nenhuma alteração em services, AppContext, projectMetrics ou migrations. Não foi realizado deployment nem teste autenticado do backend.

## Fluxos de menu e formulários

Menu reutiliza ActionMenu, com rótulos “Editar projeto”, “Arquivar” e “Excluir projeto”, divisória e escopo de estilos local. Contexto completo do filho 48471:14386 consultado após resposta esparsa do frame. Teclado, Escape e edição existente verificados.

Novo projeto usa Modal, Input/Select/DateInput e Button compartilhados; largura 600px em (420,120). Contexto completo 48476:423 inclui Status 48483:14339. O Status inicial já existia; os valores todo/in_progress/review/completed foram preservados, inclusive o auto-sync que posteriormente os deriva das tarefas. Não foi criada a função de status manual persistente. Cores mantêm os seis valores gravados; apenas os swatches mudam para tokens. Limite de descrição continua 200. Contador mostra o tamanho real, não o número ilustrativo do Figma. Datas continuam inputs nativos: o formato exibido depende da plataforma/idioma do navegador.

Cliente usa Modal compartilhado em camada nativa sobre o projeto, com largura 520px em (460,200). Contexto completo 48476:1245 consultado. Campos, validação de nome, estado saving, callbacks e ID retornado preservados. Escape fecha apenas o modal superior; rascunho do projeto fica intacto. Corpos desses dois modais não encolhem por baixo do rodapé em viewport estreita; a rolagem permanece no dialog.

forms-verification.json registra nove verificações com AppContext sintético e estado: Escape aninhado, foco, 1024/390px, criação e seleção do cliente, cores/status, limite, nome obrigatório, payload integral e edição por ID. Comparação AST confirmou 28 cálculos/handlers preservados, incluindo constantes/defaults e handlers dos dois formulários; callbacks de mutação da página foram verificados pelos payloads, pois receberam novos estados visuais e tratamento de erros.

## Exclusão e arquivamento

Excluir usa Modal/Button compartilhados, composição de confirmação em 440px, ação de arquivar e ação danger. O backend/local não garante o texto “tarefas ficam sem projeto” da referência: AppContext remove o projeto da lista e o service exclui só o registro. Não fizemos promessa sobre tarefas nem mudamos FK/schema/services. Texto mantém o aviso irreversível e a desvinculação da meta no agregado existente. Excluir continua chamando deleteProject(id), com o mesmo retorno à galeria quando o projeto ativo é removido. Estado pending bloqueia nova confirmação e Escape enquanto a requisição corre. Erros são exibidos dentro da confirmação.

Arquivar continua updateProject(id,{status:'archived'}), com toast em 24px do canto inferior direito e Desfazer por 6s conforme handoff principal. Contexto completo do filho 48477:939 consultado. Desfazer chama o handler de restaurar existente: escreve todo e deixa o auto-sync derivar o status. Toast recebeu somente props opcionais icon/className para reutilizar a implementação compartilhada com ícone Archive; padrões dos demais avisos permanecem iguais. Erros de arquivar/restaurar usam aviso; erros de projeto/cliente ficam no formulário, visíveis acima do backdrop.

actions-verification.json registra seis verificações: cancelar sem escrita, erro com retry, alternativa de arquivar sem exclusão, Desfazer e status derivado, modais/toast em 1024/390px e erro de criação com rascunho preservado. Exclusão confirmada por ID, navegação e arquivo/desfazer também executados em scripts locais específicos. Requisições Supabase bloqueadas; não houve teste autenticado nem deployment. Falhas injetadas verificam a UI e callbacks; não validam rollback do estado otimista do AppContext, que não foi alterado.
