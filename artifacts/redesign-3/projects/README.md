# Projetos — Redesign 3.0 (em andamento)

Referências do arquivo Figma `8BETSzvCvZT1odD8o05jhL`, página `48412:153`:

| Tela | nodeId | Captura |
|---|---|---|
| Galeria | 48470:2 | projetos-galeria-1440.png |
| Arquivados | 48471:13288 | projetos-arquivados-1440.png |

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

Visão geral do projeto (48473:2), Kanban (48474:241), Lista (48475:265), Calendário (48475:860), Sem projetos (48477:953) e os fluxos de menu, criação, cliente, exclusão e arquivo com Desfazer. O workspace e seus modais ainda estão com a apresentação anterior; diálogos nativos desses fluxos serão migrados na unidade correspondente. A limpeza dos estilos antigos de Projects fica para o fim do módulo.
