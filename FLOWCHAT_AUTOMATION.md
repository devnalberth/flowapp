# FlowChat - Sistema de Automação com IA

## 🎯 O que foi implementado?

Sistema completo de automação para o FlowChat executar ações reais a partir de linguagem natural.

### Arquitetura

```
┌─────────────────┐
│   AIAssistant   │  ← Interface do chat
└────────┬────────┘
         │
    ┌────▼─────┐
    │ aiService│      ← Processa comandos com IA
    └────┬─────┘
         │
    ┌────▼────────┐
    │ AppContext  │   ← Estado global (tasks, finances, habits)
    └─────────────┘
```

## 📁 Arquivos criados

1. **`/src/context/AppContext.jsx`**
   - Context API com estado global
   - Actions: `addTask`, `addFinance`, `addHabit`, etc.

2. **`/src/services/aiService.js`**
   - Integração com OpenAI (GPT-4o)
   - Function calling para executar ações
   - Mock para testar sem API key

## 🚀 Como usar

### Modo 1: Mock (sem API key) - JÁ FUNCIONA!

O sistema já funciona com detecção simples de padrões:

```javascript
// Exemplos de comandos que funcionam:
"Crie uma tarefa 'Entregar projeto' para quinta 14h"
"Adicione uma receita de R$ 1500 categoria Freelancer"
"Marque o hábito Treino como concluído"
```

### Modo 2: IA Real (com OpenAI)

Para ativar processamento avançado com IA:

#### 1. Instalar dependência:
```bash
npm install openai
```

#### 2. Criar arquivo `.env.local` na raiz do projeto:
```env
VITE_OPENAI_API_KEY=sk-proj-sua-chave-aqui
```

#### 3. Atualizar AIAssistant.jsx:
```jsx
// Trocar esta linha:
import { processCommandMock } from '../../services/aiService.js'

// Por:
import { processCommand } from '../../services/aiService.js'

// E no handleSend:
const result = await processCommand(value, {
  addTask,
  addFinance,
  addHabit,
  completeHabit,
})
```

## 🧪 Testando agora

1. Execute o projeto:
```bash
npm run dev
```

2. Acesse AI Assistant no menu

3. Teste comandos:
   - "Crie uma tarefa 'Reunião com cliente' para amanhã 10h"
   - "Adicione uma despesa de R$ 150 em Alimentação"
   - "Marque Leitura como concluído"

## 📊 Funções disponíveis para a IA

### create_task
```javascript
{
  title: "Entregar projeto",
  dueDate: "2026-01-16",
  dueTime: "14:00",
  priority: "Urgente",
  context: "Trabalho"
}
```

### create_finance
```javascript
{
  type: "receita", // ou "despesa"
  value: 1500,
  category: "Freelancer",
  date: "15/01",
  description: "Projeto FlowApp"
}
```

### complete_habit / create_habit
```javascript
{
  habitName: "Treino Muay Thai"
}
```

## 🔄 Próximos passos

### Para produção:
1. ✅ Context API funcionando
2. ✅ Mock de IA funcionando
3. ⏳ Integrar OpenAI real (opcional)
4. ⏳ Persistência (localStorage ou backend)
5. ⏳ Melhorar detecção de padrões no mock

### Melhorias futuras:
- Editar/deletar itens via chat
- Buscar informações ("Quais tarefas tenho hoje?")
- Sugestões inteligentes baseadas em histórico
- Integração com calendário

## 💡 Dicas

**Mock vs IA Real:**
- Mock: Gratuito, rápido, bom para desenvolvimento
- IA Real: Mais preciso, entende contexto complexo, custo por uso

**Custo OpenAI:**
- GPT-4o: ~$0.005 por comando (muito barato)
- Use mock durante desenvolvimento e ative IA para produção

## 🐛 Troubleshooting

**"Configure sua API Key"**: Normal, use o mock por enquanto ou configure a API key

**Ação não executada**: Verifique o console para logs de debug

**Estado não persiste**: Normal, implemente localStorage/backend depois
