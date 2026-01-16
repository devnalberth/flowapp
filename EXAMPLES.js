// ================================
// EXEMPLOS DE COMANDOS PARA TESTAR
// ================================

// 1️⃣ CRIAR TAREFAS
"Crie uma tarefa 'Reunião com cliente' para quinta 14h"
"Adicione a tarefa 'Revisar código' prioridade alta"
"Nova tarefa: entregar relatório amanhã às 9h"

// 2️⃣ FINANÇAS
"Adicione uma receita de R$ 2500 categoria Freelancer"
"Registre uma despesa de R$ 89,90 em Alimentação"
"R$ 1500 receita Consultoria data 20/01"

// 3️⃣ HÁBITOS
"Marque Treino Muay Thai como concluído"
"Completei o hábito Leitura hoje"
"Registre Meditação como feito"

// 4️⃣ MÚLTIPLAS AÇÕES (testando interpretação)
"Crie a tarefa 'Fazer deploy' para sexta 16h, adicione uma receita de R$3000 em Projetos e marque Exercício como concluído"

// 5️⃣ LINGUAGEM NATURAL
"Preciso lembrar de ligar para o dentista amanhã de manhã"
"Gastei 250 reais no mercado hoje"
"Consegui manter minha série de corrida"

// ================================
// COMO FUNCIONA INTERNAMENTE
// ================================

// MODO MOCK (atual - sem API key):
// - Detecta palavras-chave: "tarefa", "receita", "despesa", "hábito", "R$"
// - Extrai informações básicas com regex
// - Cria objetos e adiciona ao Context

// MODO IA (com OpenAI configurada):
// - Envia comando para GPT-4o
// - GPT analisa e decide quais funções chamar
// - Executa function_call: create_task, create_finance, complete_habit
// - Retorna resposta natural + ações executadas

// ================================
// TESTAR AGORA
// ================================

// 1. Rode: npm run dev
// 2. Acesse "AI Assistant" no menu
// 3. Digite qualquer comando acima
// 4. Veja os cards serem criados automaticamente
// 5. Navegue para "Tarefas", "Financeiro" ou "Hábitos" para ver os dados criados

// ================================
// PRÓXIMOS PASSOS (OPCIONAL)
// ================================

// Para ativar IA real (GPT-4o):
/*
1. npm install openai

2. Crie .env.local:
   VITE_OPENAI_API_KEY=sk-proj-sua-chave-aqui

3. Em AIAssistant.jsx, troque:
   import { processCommandMock } from '../../services/aiService.js'
   por:
   import { processCommand } from '../../services/aiService.js'
   
   E use:
   const result = await processCommand(value, { addTask, addFinance, addHabit, completeHabit })
*/
