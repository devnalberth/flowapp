# Metas — Redesign 3.0 (em andamento)

Referência: Figma `8BETSzvCvZT1odD8o05jhL`, página `48412:153`. Capturas locais em 1440px e 390px, com dados sintéticos no AppContext, sem autenticação nem escritas no Supabase.

| Tela | nodeId | Captura desktop |
|---|---|---|
| Painel | 48456:7536 | metas-painel-1440.png |
| Área Profissional | 48459:195 | metas-area-1440.png |
| Detalhe financeiro | 48460:2 | metas-detalhe-1440.png |
| Meta concluída | 48462:2 | metas-concluida-1440.png |
| Sem metas | 48468:12372 | metas-sem-metas-1440.png |
| Nova meta | 48463:2; modal 48463:328 | metas-nova-meta-1440.png |
| Editar meta | 48463:512 | metas-editar-meta-1440.png |
| Excluir meta | 48463:10513 | metas-excluir-meta-1440.png |

Contexto, screenshot e motion consultados para cada referência. Nova meta retornou contexto esparso: implementação baseada no contexto completo do modal filho. Animações são de entrada, sem repetir o loop de apresentação do Figma; movimento reduzido usa os presets existentes.

## Escopo preservado

- `aggregateGoals`, `LIFE_AREAS`, `quarterColumns`, regras de criação/edição, vínculos de projeto e payload do formulário preservados por comparação AST (9 funções/expressões). As funções de agenda e os services não mudaram.
- `categoryRevenue` passou a ser exportada, sem alteração do corpo. O detalhe financeiro usa o cálculo já existente no FinanceGoalCard. O progresso salvo e as agregações continuam com a regra original dos projetos; podem divergir do valor mensal financeiro exibido no herói.
- Formulário mantém as datas automáticas por tipo, opção personalizada, limite de 280 caracteres, um seletor de projeto e campos financeiros existentes.
- Substituída a confirmação nativa de exclusão por ConfirmModal. A chamada continua `deleteGoal(editGoal.id)`. Cancelar conserva o rascunho da edição; confirmação tem estado pendente e feedback.
- Demais modais do mapa ainda usam a implementação anterior. Não foram concluídos neste avanço.

## Diferenças conscientes / limitações

- Revisão trimestral e vínculo de hábitos ficam para a seção 10.2. Não são anunciados nem simulados. No detalhe, o KPI correspondente mostra o progresso dos projetos existentes.
- Data de conclusão, antecipação do prazo, resultado de corrida e data de encerramento de projeto não estão armazenados. O estado concluído usa os dados de progresso existentes, sem fabricar essas informações.
- KPIs abrangem todas as metas retornadas pelo app, sem introduzir um filtro anual novo. Números e imagens são dinâmicos; as capturas usam fixtures e diferem dos números ilustrativos do Figma.
- Editar uma meta com múltiplos projetos mantém todos se o projeto escolhido já pertence à lista. Escolher outro projeto ou nenhum remove os vínculos anteriores: o aviso explica essa regra existente.
- Problema preexistente registrado: `calculateTrimester` usa `new Date(YYYY-MM-DD)` e getters locais. Em America/Maceio, 01/10/2026 pode ser interpretado como setembro; datas Q4 corretas produzem `trimesterValues: [3,4]`. Mantido neste re-skin para não mudar negócio. Exige correção separada.
- Controles de data/select são nativos; ordem de data, ícone e menu dependem do navegador/sistema.
- Imagens do mapa usam URLs reais em produção; as imagens gradientes das capturas são fixtures externas ao código do app.

## Verificação

`browser-verification.json`: criação, dados enviados, datas automáticas, abertura por área, navegação, máscara financeira, conclusão, cancelamento de exclusão com rascunho preservado, edição, exclusão confirmada e responsividade. Requisições Supabase bloqueadas no harness. Nenhuma persistência autenticada real verificada.

`npm run build` passa; mantém os avisos anteriores sobre módulos Node do SDK Anthropic e tamanho do bundle. Sem deploy/push.

## Próxima unidade

Mapa dos sonhos: adicionar/editar imagem (48468:199) e visualizar imagem (48468:871). Depois, remover a apresentação antiga não utilizada e finalizar a revisão do módulo antes de Projetos. Revisão trimestral continua adiada.
