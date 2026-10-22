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
- Sem próximo agendado, herói mostra progresso agregado; botão Novo estudo abre o formulário existente. Estados Sem estudos e Estudo sem conteúdo ainda serão comparados aos seus próprios frames.

## Verificação

panel-verification.json: dez verificações com AppContext sintético, requisições Supabase bloqueadas e data da fixture congelada em 15/10/2026. Seis estudos, 62/101 unidades (61%), 4 agendados na semana, filtro combinado, estado sem resultado, teclado, navegação original ao detalhe e formulário, contrato de navegação ao timer, quatro assets locais não vazios a 96×96, 1024/390px, movimento reduzido e loading sem cards obsoletos. Sem erros de runtime ou escritas de dados nas ações do painel.

Comparação AST confirmou 23 cálculos/handlers originais intactos em Studies.jsx. studyMetrics, services, AppContext, APIs e migrations não foram alterados. Build e diff check passaram; permanecem avisos anteriores de bundle grande. Validação local; sem teste autenticado do backend ou deployment.

## Próximas unidades

Detalhe 48490:15645, Sem estudos 48496:18184, Estudo sem conteúdo 48496:18357, Novo estudo 48494:14922, Adicionar conteúdo 48495:15277, Excluir estudo 48496:16429 e referência Estudar 48496:17717. Não implementar Caderno, busca do caderno ou edição de estudo da seção 10.2. Detalhe e modais ainda usam a apresentação anterior, com seus handlers preservados. A limpeza dos estilos e componentes antigos fica para o fim do módulo.
