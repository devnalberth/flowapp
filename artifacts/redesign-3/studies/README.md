# Estudos — Redesign 3.0 (em andamento)

Referência: arquivo 8BETSzvCvZT1odD8o05jhL, página 48412:153, Painel 48489:14339. Contexto completo, screenshot e motion consultados. Capturas estudos-painel-1440/1024/390.png.

## Painel implementado

Herói 548×306 em (288,199.8), quatro KPIs de 266×145, painéis de próximos estudos e jornada por tipo com 548×346, filtros e grade de três colunas de 360px/gap16. Componentes compartilhados HeroCard/HeroRings, KpiCard, CardHeader, ProgressRing, ProgressBar, FilterPill, StatusBadge, Button e EmptyState. Entradas usam presets do projeto, sem loop e com movimento reduzido.

Capas sem imagem usam os quatro SVGs exportados do Figma em public/assets/redesign/studies. Camadas de origem: book-open 48490:14733, graduation-cap 48490:14787, book da capa do livro e compass 48490:14895. Raiz e geometria efetiva 96×96; símbolos em right20/top36 dentro da capa de 112px, com clipping. Imagens coverUrl continuam dinâmicas, sem substituição por asset genérico.

## Conflitos / escopo preservado

- Caderno e sua busca global permanecem fora desta etapa. Não foi criado campo de busca sem função.
- Sem histórico persistido do último estudo aberto, o herói usa o primeiro item de agg.upcoming e o rótulo “Próximo estudo”. Não promete retomada de sessão.
- O vínculo do hábito “2h de estudos” não existe nas métricas do painel. A barra mostra a jornada agregada já calculada, sem inventar hábito, objetivo ou tempo.
- Estudar mantém a navegação atual ao pomodoro em Tarefas, com initialFilter flow e studyTarget. Não foi implementado um segundo timer nem continuidade entre páginas.
- O progresso original conta aulas e blocos folha vazios; subtítulo usa “conteúdo”, e os rótulos mantêm “itens” quando existem blocos. Capítulos/encontros são rótulos de apresentação para Livro/Mentoria quando todas as unidades são aulas.
- Filtros de status e tipo continuam independentes e combinados; métricas gerais não mudam ao filtrar. “Todos os tipos” aparece quando há tipo aplicado, para permitir o reset existente.
- Agendados na semana mantém a contagem original, que inclui concluídos. Não fabricamos o número “2 feitos” da referência.
- Próximos mantém o limite original de cinco e a ordenação por scheduledDate; o card cresce se necessário. Não limitamos a quatro para reproduzir a fixture.
- Sem próximo agendado, herói mostra progresso agregado; botão Novo estudo abre o formulário existente. Estados vazios foram implementados a partir dos seus próprios frames (ver abaixo).

## Verificação

panel-verification.json: dez verificações com AppContext sintético, requisições Supabase bloqueadas e data da fixture congelada em 15/10/2026. Seis estudos, 62/101 unidades (61%), 4 agendados na semana, filtro combinado, estado sem resultado, teclado, navegação original ao detalhe e formulário, contrato de navegação ao timer, quatro assets locais não vazios a 96×96, 1024/390px, movimento reduzido e loading sem cards obsoletos. Sem erros de runtime ou escritas de dados nas ações do painel.

Comparação AST confirmou 23 cálculos/handlers originais intactos em Studies.jsx. studyMetrics, services, AppContext, APIs e migrations não foram alterados. Build e diff check passaram; permanecem avisos anteriores de bundle grande. Validação local; sem teste autenticado do backend ou deployment.

## Próximas unidades

Adicionar conteúdo 48495:15277, Excluir estudo 48496:16429 e referência Estudar 48496:17717. Não implementar Caderno, busca do caderno ou edição de estudo da seção 10.2. Adicionar conteúdo e os demais fluxos ainda usam a apresentação anterior, com seus handlers preservados. A limpeza dos estilos e componentes antigos fica para o fim do módulo.

## Detalhe implementado — 48490:15645

Contexto, screenshot e motion do Figma consultados. Hero 548×306 em (288,247.6), quatro KPIs, cabeçalho Conteúdo e árvore de módulos, sub-módulos, matérias e aulas. Capturas estudo-detalhe-1440/1024/390.png. StudyDetail e StudyContentTree reutilizam os componentes e presets compartilhados.

A árvore mantém compareMixedNodes, moduleProgress, countProgressUnits, isEmptyLeaf e os handlers existentes. Aulas abrem o LessonModal atual; editar estudo e Caderno seguem adiados. Controles de editar/excluir blocos permanecem disponíveis para preservar ações existentes. KPIs sem destino existente não recebem setas decorativas acionáveis. O rótulo itens reflete blocos folha vazios no cálculo; avaliações e agendamentos vêm dos dados, sem reproduzir números fictícios do wireframe.

detail-verification.json: dez verificações locais com contexto sintético e Supabase bloqueado. Testados 18/25 unidades, conclusão e reabertura de aula e matéria vazia com atualização do agregado, editor de aula existente, contrato de navegação Tarefas, link externo, ordenação intercalada por created_at e ausência de overflow em 1024/390px. Nenhum erro de runtime. Comparação AST dos 23 cálculos/handlers originais e build passaram. Permanecem avisos de bundle e externalização do SDK Anthropic. Services, APIs, banco e migrations intactos. Sem validação autenticada ou deployment.

## Estados vazios implementados

Sem estudos 48496:18184 e Estudo sem conteúdo 48496:18357: contextos completos, screenshots e motion consultados individualmente, com print da implementação apresentado antes de avançar. StudyEmptyState compõe EmptyState e Button compartilhados, com passos numerados, card branco, padding64 e ícone64/28. EmptyState recebeu apenas children opcional; usos anteriores preservam seu comportamento.

Sem estudos: card (288,199.8), largura1112, sem métricas ou filtros sem dados; CTA abre CreateStudyModal existente. Mantido o subtítulo sobre conteúdo, pois o progresso inclui blocos vazios. Estudo sem conteúdo: hero548×306 em (288,220.6), KPIs zero, orientação de agendamento e card vazio em (288,610.6); CTA abre ModuleModal com allowedKinds module. Edição de estudo continua adiada. Ícones usam os mesmos Lucide existentes identificados nos componentes do Figma; herói usa o asset compartilhado local.

empty-verification.json e no-content-verification.json: seis verificações em cada estado, incluindo geometria desktop, três passos, abertura dos formulários sem salvar, ausência de overflow em1024/390 e nenhuma escrita/erro de runtime. Fixtures sintéticas com Supabase bloqueado. Capturas sem-estudos-* e estudo-sem-conteudo-*. Build passou e os23 cálculos/handlers originais continuam intactos. Novo estudo também implementado (ver abaixo); seguem os fluxos de conteúdo/exclusão/Estudar.

## Novo estudo implementado — 48494:14922

Frame completo consultado com screenshot e motion. A resposta inicial esparsa foi complementada pela leitura das camadas e contextos completos do modal 48494:15686 e overlay 48494:15682. Modal compartilhado de 600px, tile 40, quatro tipos com tile 34/ícone 17, campos compartilhados, capa com envio/arraste, descrição de até 200 caracteres e rodapé. Ícones são os mesmos Lucide identificados no Figma; nenhum asset temporário em runtime. Entrada usa animação única e movimento reduzido do Modal, sem repetir o loop de demonstração do Figma. Dimensão medida600×783.125 em(420,108.4375) no viewport1440×1000; referência600×782 em(420,109). O frame completo tem1500 px, mas o modal foi posicionado no Figma em relação aos1000 px iniciais. Captura desktop usa esse viewport.

Mantidos quatro IDs de tipo, nove categorias, quatro status, defaults, título trim, conversão dos opcionais para null, upload anterior à criação, payload e reset após sucesso. Nome do estudo usa rótulo de acordo com o tipo. Subtítulo menciona conteúdo, porque o cálculo existente também inclui blocos folha vazios. A descrição recebeu o limite de 200 explicitado no documento, sem migração ou truncamento de registros existentes.

O catch que exibia alert na página foi retirado para o erro chegar ao formulário. Assim, falhas de criação e upload mostram o Toast compartilhado dentro do diálogo e preservam os campos; o aviso fica visível na camada nativa do modal. Backend, service e AppContext intactos. O comportamento do service ao retornar null para bucket de capa ausente permanece como estava.

new-study-verification.json: 11 verificações locais com AppContext e upload simulados, sem escrita real no Supabase. Testados os quatro payloads completos, trim/null, capa/remoção/upload antes de criar, limite/contador 200, falhas de upload e criação sem fechar ou apagar campos, Enter para tentar novamente, foco inicial e preso, Esc e retorno ao acionador, movimento reduzido e 1024/390 sem overflow. Corpo do modal rola em alturas pequenas e mantém rodapé separado do conteúdo; captura 390-conteudo mostra a parte inferior. Sem erros de runtime; os dois erros de console esperados vêm das falhas simuladas.

Comparação AST: 22 cálculos/handlers anteriores da página intactos, além das categorias e seis handlers de formulário/arquivo. handleCreateStudy mudou apenas o tratamento de erro de interface, conforme acima. Build e diff check passaram, com os avisos de bundle/SDK já existentes. Validação local; backend autenticado e deployment não executados. Próxima unidade: Adicionar conteúdo 48495:15277.
