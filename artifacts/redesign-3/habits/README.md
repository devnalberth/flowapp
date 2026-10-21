# Hábitos — Redesign 3.0

Implementação local de 21/10/2026. React/Vite e componentes existentes, sem dependências novas.

## Referências e capturas

Figma: arquivo `8BETSzvCvZT1odD8o05jhL`. Todos os nodes abaixo foram consultados com contexto, screenshot e contexto de animação. O detalhe do hábito exigiu contexto adicional do filho `48448:222`, porque o frame completo retornou metadados esparsos.

| Tela | Node | Captura local |
|---|---|---|
| Diário | `48441:4912` | [1440 px](habitos-diario-1440.png) |
| Semanal | `48443:2` | [1440 px](habitos-semanal-1440.png) |
| Mensal | `48445:2` | [1440 px](habitos-mensal-1440.png) |
| Estatísticas | `48446:2` | [1440 px](habitos-estatisticas-1440.png) |
| Sem hábitos | `48450:9123` | [1440 px](habitos-sem-habitos-1440.png) |
| Detalhe do dia | `48447:2` | [1440 px](habitos-detalhe-dia-1440.png) |
| Detalhe do hábito | `48448:2` | [1440 px](habitos-detalhe-habito-1440.png) |
| Novo hábito | `48449:2` | [1440 px](habitos-novo-habito-1440.png) |
| Editar hábito | `48449:396` | [1440 px](habitos-editar-habito-1440.png) |
| Excluir hábito | `48449:8201` | [1440 px](habitos-excluir-habito-1440.png) |
| Dia completo | `48450:8671` | [1440 px](habitos-dia-completo-1440.png) |

São 11 referências, incluindo as quatro visões, dois estados e cinco diálogos/fluxos. Capturas adicionais: quatro visões em 390 px, Diário em 1024 px e formulário em 390 px. As imagens usam dados fictícios em um harness local com os componentes reais e AppContext simulado, data fixa de 15/10/2026 e fuso America/Maceio. Não são capturas de produção nem de uma conta autenticada.

## Verificação

- Build de produção aprovado. Persistem avisos anteriores de bundle grande e módulos Node externalizados pelo SDK Anthropic.
- `git diff --check` aprovado.
- Comparação AST de 12 cálculos/handlers originais: hábitos com metadados, filtros, progresso de foco, ordenação diária, KPIs, semana, calendário mensal, detalhe do dia, leitura de conclusões, toggle e navegação mensal. Sem alteração; `habitStats.js` e AppContext não foram modificados.
- Navegador: checklist/KPIs, busca, categorias, filtro ativo nas estatísticas, conclusão por data, Escape/foco, navegação mensal, links do heatmap/detalhe, criação/edição e cancelamento/confirmação da exclusão. Resultado em [browser-verification.json](browser-verification.json).
- Movimento reduzido: modal sem deslocamento, fade de 150 ms; quatro visões sem overflow da página em 390 px e Diário em 1024 px.
- Ativos estáticos originais reutilizados: símbolo 32×32 e HeroRings 360×220. Ícones são os mesmos Lucide da biblioteca; anéis, barras e células são dados dinâmicos.
- Geometria desktop: herói 548×306; checklist 740×560; sequências 356×560; painel semanal 740×581; mensal 740×546; primeira linha de estatísticas 740×357 e 356×357.

## Diferenças conscientes

- Números, ordem e preenchimentos vêm dos cálculos reais, não dos números ilustrativos do Figma. Mantidos 12 períodos semanais, 30 dias de consistência e 126 dias no heatmap; dependendo do alinhamento da semana, o heatmap pode ocupar 19 colunas. Incluída a legenda exigida pelo componente Figma também no detalhe individual.
- O banco não guarda a origem da conclusão. O detalhe do dia omite “marcado à mão”; o progresso do timer usa os minutos existentes por categoria, sem inferir origem da conclusão.
- O texto da edição não promete mudanças válidas apenas de hoje em diante: o comportamento atual considera a frequência atual ao recalcular estatísticas. As conclusões registradas continuam preservadas.
- Lembrete e associação com metas permanecem adiados (seção 10.2). Sem controles sem implementação para esses campos.
- O seletor de horário continua sendo o controle nativo existente; o navegador/sistema pode exibir 12h ou 24h, embora o valor enviado seja HH:mm.
- Quando uma categoria selecionada no Diário permanece ativa em Estatísticas, o filtro aparece para poder ser identificado e limpo. O estado padrão sem filtro segue a composição do Figma.

## Correção dos metadados existentes

A seção 11 solicitava corrigir descrição, horário ideal e ícone que não chegavam ao banco. Migration `20261021140637_persist_habit_metadata` aplicada no projeto FlowApp, com três campos opcionais e RLS mantida; serviço ajustado em commit separado. [Registro da alteração](../../../docs/proposals/habit-metadata.md).

Teste de contrato em memória aprovado para criar → ler → editar → ler, limpeza dos campos, updates parciais e filtros de proprietário. Não houve escrita em hábitos reais durante a validação. Ainda falta testar esse ciclo com uma conta autenticada e recarregamento real contra a API. Nenhum deploy ou push foi realizado nesta etapa.
