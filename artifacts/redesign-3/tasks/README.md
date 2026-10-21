# Tarefas — Redesign 3.0

Implementação local dos frames `48429:1395` (Hoje), `48434:3776` (Arquivadas) e fluxos `48430:1633`, `48431:1941`, `48431:2237`, `48432:2501`, `48432:2895`, `48432:3089`, `48433:3247`, `48433:3531`, no arquivo Figma `8BETSzvCvZT1odD8o05jhL`.

## Prints

- `tarefas-hoje-1440.png`: timer com tarefa vinculada, KPIs e lista em 1440 × 1128.
- `tarefas-arquivadas-1440.png`: restauração e campos existentes, sem data de arquivamento inventada.
- `nova-tarefa.png`, `tarefa-detalhe.png`, `timer-personalizado.png`, `painel-produtividade.png`.
- `tarefa-concluida-toast.png`, `tarefa-arquivada-toast.png`, `excluir-tarefa.png`.
- `tarefas-vazias.png` e adaptações de 1100, 900 e 390 px.

Os prints usam registros artificiais num harness externo ao código do app. Não incluem autenticação nem alterações em dados reais. A sessão autenticada com dados reais ainda precisa ser validada.

## Escopo e decisões

- Somente interface: services, utilitários de negócio, AppContext, timer e contratos de API preservados. Nenhuma dependência ou migration adicionada.
- Por orientação expressa do usuário, **data de arquivamento e quantidade de sessões por tarefa foram omitidas**. O detalhe conserva o tempo de foco registrado. O contador de sessões do timer atual permanece.
- Subtarefas mantêm adicionar, remover e consulta. Os checks existentes são exibidos como leitura; nenhuma nova operação de conclusão de subtarefa foi criada.
- Os filtros e a ordenação conservam sua implementação. Hoje apresenta também um grupo visual com as tarefas concluídas agendadas para o dia, respeitando o corte semanal já existente. Finalizadas continua usando a data real de conclusão e o início da semana.
- Sem variações fictícias nos KPIs. Os indicadores usam registros reais e contexto descritivo.
- O texto de Eisenhower presente no modal do Figma foi substituído pela explicação de prioridade/Flow, conforme decisão 12 do handoff: Eisenhower não entra.
- Nova tarefa e Novo evento continuam acessíveis no menu contextual da topbar. O formulário de evento e a página Agenda pertencem à próxima etapa.
- Datas e horas reutilizam o parser existente do formulário; campos nativos acompanham o idioma do navegador.
- Arquivar conserva confirmação e ganha toast com Desfazer; excluir conserva confirmação separada, com alternativa de arquivar no texto. O detalhe usa gaveta de 540 px como no frame.
- Modal/ConfirmModal compartilhados receberam apenas propriedades opcionais para ações no cabeçalho, tamanho e conteúdo da confirmação; defaults das outras telas preservados.

## Verificação

`verification.json` registra os testes de navegador: geometria do Figma; filtros e categorias; timer com avanço de relógio; painel Hoje/7 dias; configuração personalizada; formulário com data/hora local convertida em ISO e tag Flow; arquivar, restaurar, concluir e Desfazer; confirmação de exclusão; máscara financeira; conta vazia; teclado/Escape e movimento reduzido; larguras 1440, 1100, 900, 390.

A comparação de AST confirmou filtros, ordenação, restauração, reagendamento, parser de datas, payload do formulário e cálculos do painel preservados. Os arquivos de services, utils, AppContext e useFocusTimer permanecem iguais ao início desta etapa. Build Vite e `git diff --check` passaram. Permanecem os avisos de build preexistentes de módulos Node do SDK e bundle grande.
