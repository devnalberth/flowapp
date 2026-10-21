# Redesign 3.0: fundação, componentes e shell

Implementação das fases 1, 2 e 3 do `FLOWAPP-REDESIGN.md`.

- Figma: arquivo `8BETSzvCvZT1odD8o05jhL`, template `48417:180`.
- Componentes: `48415:2`, `48420:222` e seus nodes individuais.
- Referência visual consultada por `get_design_context` e captura em 1440 × 1024.
- Os interiores das telas ainda são os atuais. A migração visual começa pelo Início.
- A entrada Agenda será conectada junto da implementação de Tarefas + Agenda; não há link sem destino.

## Capturas

- `shell-1440.png`: shell real montado isoladamente, com painel vazio, como o template.
- `shell-1100.png`, `shell-900.png`, `shell-390.png`: comportamento responsivo do shell.
- `components.png`: componentes reais, com valores explicitamente de teste.
- `integration-*.png`: verificação da casca nas telas existentes e abertura dos formulários atuais. Não são entregas finais de redesign dessas telas.

## Verificação

`verification.json` registra os testes de navegação, criação contextual, preferências, teclado, foco, movimento reduzido e geometrias.

A validação foi feita em um ambiente isolado de componentes, com o `AppProvider` real e `userId=null`. Não foi criada uma rota de preview no aplicativo, não foi contornada a autenticação do app e não foram usados dados ou gravações de produção. A validação autenticada com dados reais permanece pendente.

O build de produção passou. Os avisos de tamanho do bundle e módulos Node do SDK de IA já existiam antes desta etapa.

Os handlers extraídos de Perfil e Segurança foram comparados por AST com a versão anterior. `src/services/`, `src/utils/` e `src/context/AppContext.jsx` foram comparados com a cópia de referência e permaneceram inalterados.

Contrastes verificados: ação principal 18,37:1; tinta sobre Brasa 6,54:1; texto Brasa 4,57:1; legenda sobre painel 4,77:1; status sucesso 4,77:1, erro 4,76:1, alerta 4,57:1 e informação 5,56:1.
