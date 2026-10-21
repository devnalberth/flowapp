# Início — Redesign 3.0

Implementação local da grade e dos estados dos frames `48422:319` (Dashboard), `48427:576` (Dia fechado), `48428:842` (Dia livre) e `48428:2411` (Com atrasos), arquivo Figma `8BETSzvCvZT1odD8o05jhL`.

## Prints

- `inicio-foco-1440.png`: sessão Deep Work em andamento; viewport 1440 × 1644.
- `inicio-closed-1440.png`: planejamento do dia concluído.
- `inicio-free-1440.png`: tarefas sem agendamento para hoje.
- `inicio-atrasos-1440.png`: pendências anteriores, ação Mover para hoje.
- `inicio-empty-1440.png`: conta sem registros.
- `inicio-1100.png`, `inicio-900.png`, `inicio-390.png`: adaptação responsiva.

Os prints usam dados artificiais em um harness externo ao app, sem autenticação e sem alterações no backend. Esses dados e qualquer configuração de teste não estão no código de produção. A validação com uma sessão autenticada e dados reais permanece pendente.

## Escopo e diferenças preservadas

- O gráfico conserva a janela de **últimos sete dias** e os cálculos originais de produtividade, incluindo Dia, Semana, Mês e configuração da meta diária. Não foi alterado para uma semana fixa de domingo a sábado.
- Metas usam o progresso já derivado na página Metas, pela média dos projetos vinculados ou pelo progresso salvo. São exibidas até três metas ativas com prazo mais próximo; nenhuma revisão trimestral foi criada.
- O FlowChat conserva conversa e atalhos existentes. Sem provedor, mostra a configuração. **Resumo automático do dia e cache diário não foram implementados**: seção 10.2.
- Agenda usa os eventos existentes e o editor atual. A navegação completa de Agenda e o redesign dos formulários de tarefa/evento pertencem à próxima etapa Tarefas + Agenda.
- O timer de Tarefas foi extraído para `useFocusTimer`, sem modificar funções, configurações, contagem, categorias, payloads ou persistência. A sessão mantém o ciclo de vida local já existente, inclusive ao sair da página.

## Verificação

`verification.json` registra os testes de navegador. Conferidos: oito cards nas posições e dimensões do Figma em 1440 px; asset local dos anéis 360 × 220 no slot correto; timer com avanço de relógio e pausa; tarefa concluída; hábito manual e AUTO; reagendamento; calendário e meta diária por teclado; máscara financeira; quatro estados; conta vazia; responsividade; movimento reduzido. Zero erros de execução e zero escritas no backend no ambiente de teste.

A comparação estrutural das funções confirmou identidade das funções do timer extraídas, dos handlers do FlowChat e dos cálculos de produtividade e calendário. Services, utilitários existentes e AppContext permanecem idênticos ao início desta etapa. Build Vite e `git diff --check` passaram; os avisos preexistentes de SDK externalizado e bundle grande permanecem.
