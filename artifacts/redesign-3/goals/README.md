# Metas — Redesign 3.0

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
| Adicionar/editar imagem | 48468:199 | mapa-adicionar-1440.png |
| Visualizar imagem | 48468:871 | mapa-visualizar-1440.png |

Contexto, screenshot e motion consultados para cada referência. Nova meta retornou contexto esparso: implementação baseada no contexto completo do modal filho. Animações são de entrada, sem repetir o loop de apresentação do Figma; movimento reduzido usa os presets existentes.

## Escopo preservado

- `aggregateGoals`, `LIFE_AREAS`, `quarterColumns`, regras de criação/edição, vínculos de projeto e payload do formulário preservados por comparação AST (8 funções/expressões completas e o corpo de gravação/vínculo de handleGoalSubmit; apenas seu aviso de erro virou toast). As funções de agenda e os services não mudaram.
- `categoryRevenue` passou a ser exportada, sem alteração do corpo. O detalhe financeiro usa o cálculo já existente no FinanceGoalCard. O progresso salvo e as agregações continuam com a regra original dos projetos; podem divergir do valor mensal financeiro exibido no herói.
- Formulário mantém as datas automáticas por tipo, opção personalizada, limite de 280 caracteres, um seletor de projeto e campos financeiros existentes.
- Substituída a confirmação nativa de exclusão por ConfirmModal. A chamada continua `deleteGoal(editGoal.id)`. Cancelar conserva o rascunho da edição; confirmação tem estado pendente e feedback.
- Mapa: mesmos callbacks `addDreamMap(form, imageFile)`, `updateDreamMap(id, { title, goalId }, imageFile)` e `deleteDreamMap(id)`. Upload automático ao criar, troca opcional e edição sem novo arquivo preservados. Modal/Field/Button/ConfirmModal substituem a apresentação anterior; estados de envio e erro são locais.
- Visualização: imagem dinâmica inteira, com proporção original e tamanho limitado a 880×620 no desktop; título, meta e progresso derivados dos dados existentes. Esc, botão e clique fora fecham; foco retorna ao acionador.
- Modal compartilhado ignora o evento `cancel` de elementos filhos: cancelar o seletor de arquivos não fecha mais o diálogo. O cancel do próprio dialog por Esc continua fechando.
- Removidos os componentes e estilos visuais antigos não utilizados de Goals. Nenhum service, contexto de dados ou migration modificado.

## Diferenças conscientes / limitações

- Revisão trimestral e vínculo de hábitos ficam para a seção 10.2. Não são anunciados nem simulados. No detalhe, o KPI correspondente mostra o progresso dos projetos existentes.
- Data de conclusão, antecipação do prazo, resultado de corrida e data de encerramento de projeto não estão armazenados. O estado concluído usa os dados de progresso existentes, sem fabricar essas informações.
- KPIs abrangem todas as metas retornadas pelo app, sem introduzir um filtro anual novo. Números e imagens são dinâmicos; as capturas usam fixtures e diferem dos números ilustrativos do Figma.
- Editar uma meta com múltiplos projetos mantém todos se o projeto escolhido já pertence à lista. Escolher outro projeto ou nenhum remove os vínculos anteriores: o aviso explica essa regra existente.
- Problema preexistente registrado: `calculateTrimester` usa `new Date(YYYY-MM-DD)` e getters locais. Em America/Maceio, 01/10/2026 pode ser interpretado como setembro; datas Q4 corretas produzem `trimesterValues: [3,4]`. Mantido neste re-skin para não mudar negócio. Exige correção separada.
- Controles de data/select são nativos; ordem de data, ícone e menu dependem do navegador/sistema.
- Imagens do mapa usam URLs reais em produção; as imagens gradientes das capturas são fixtures externas ao código do app. A proporção do arquivo pode mudar a largura/altura visível da visualização, sem recortá-lo.
- O Figma anuncia JPG/PNG/WebP até 5 MB; o app atual aceita `image/*` e não valida esse limite. Mantida a aceitação existente; o texto mostra o nome real do arquivo sem anunciar uma restrição inexistente.

## Verificação

`browser-verification.json`: criação, dados enviados, datas automáticas, abertura por área, navegação, máscara financeira, conclusão, cancelamento de exclusão com rascunho preservado, edição, exclusão confirmada e responsividade. Requisições Supabase bloqueadas no harness. Nenhuma persistência autenticada real verificada.

`dream-browser-verification.json`: seleção e cancelamento do arquivo, imagem obrigatória, envio pendente, erro mantendo rascunho, criação/edição/troca/vínculo/exclusão com callbacks reais e AppContext sintético, fechamento/foco, mobile 390px e movimento reduzido. Não equivale a testar upload real no Storage.

`npm run build` passa; mantém os avisos anteriores sobre módulos Node do SDK Anthropic e tamanho do bundle. Sem deploy/push.

## Próxima unidade

Projetos, na ordem da seção 12. Revisão trimestral e demais funções da seção 10.2 continuam adiadas.
