import { useMemo, useState } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'

import './Finance.css'

const MONTH_VIEWS = [
  {
    id: 'prev',
    label: 'Novembro · 2025',
    period: 'Mês anterior',
    revenue: 'R$ 28.400',
    expense: 'R$ 19.850',
    delta: '+ R$ 8.550',
  },
  {
    id: 'current',
    label: 'Dezembro · 2025',
    period: 'Mês atual',
    revenue: 'R$ 30.120',
    expense: 'R$ 22.470',
    delta: '+ R$ 7.650',
  },
  {
    id: 'next',
    label: 'Janeiro · 2026',
    period: 'Próximo mês',
    revenue: 'R$ 31.800',
    expense: 'R$ 24.100',
    delta: '+ R$ 7.700',
  },
]

const TRANSACTION_STEPS = [
  { step: '01', title: 'Selecionar tipo', detail: 'Receita ou despesa · única ou recorrente', highlight: 'Tipo + conta' },
  { step: '02', title: 'Configurar parcelas', detail: 'Defina qtd. e intervalo (ex: 6x / mensal)', highlight: 'Parcelamentos' },
  { step: '03', title: 'Categorias + limites', detail: 'Escolha categoria e limite mensal', highlight: 'Metas de gasto' },
  { step: '04', title: 'Revisão e notas', detail: 'Adicione notas GTD e links do banco', highlight: 'Notas' },
]

const REVENUE_DATA = [
  { id: 'consult', title: 'Consultoria FlowOS', date: '05/12', account: 'Banco Inter PJ', amount: 'R$ 12.000', status: 'Confirmado' },
  { id: 'royalties', title: 'Royalties Template Notion', date: '10/12', account: 'Stripe', amount: 'R$ 4.800', status: 'Liquidação' },
  { id: 'mentoria', title: 'Mentoria Squad', date: '15/12', account: 'Nubank', amount: 'R$ 6.400', status: 'Agendado' },
  { id: 'conteudo', title: 'Conteúdo patrocinado', date: '22/12', account: 'PayPal', amount: 'R$ 2.920', status: 'Confirmado' },
]

const EXPENSE_DATA = [
  { id: 'operacao', title: 'Operação FlowApp', date: '04/12', account: 'Banco Inter PJ', amount: 'R$ 5.200', status: 'Pago' },
  { id: 'infra', title: 'Infra + SaaS', date: '09/12', account: 'Cartão Black', amount: 'R$ 3.450', status: 'Fatura' },
  { id: 'marketing', title: 'Marketing / Paid media', date: '13/12', account: 'Cartão Nu Empresarial', amount: 'R$ 4.300', status: 'Pago' },
  { id: 'educacao', title: 'Educação / Cursos', date: '18/12', account: 'Banco BTG', amount: 'R$ 2.250', status: 'Parcelado 3x' },
  { id: 'pessoal', title: 'Financeiro pessoal', date: '25/12', account: 'Cartão pessoal', amount: 'R$ 2.620', status: 'Planejado' },
]

const CREDIT_CARDS = [
  { id: 'flow-visa', name: 'Flow Visa Infinite', limit: 'R$ 25.000', used: 0.58, due: '10 jan', closing: '02 jan' },
  { id: 'nubank', name: 'Nu Empresarial', limit: 'R$ 18.000', used: 0.41, due: '05 jan', closing: '28 dez' },
  { id: 'pessoal', name: 'Pessoal Black', limit: 'R$ 12.000', used: 0.73, due: '15 jan', closing: '07 jan' },
]

const BANK_ACTIVITY = [
  { id: 1, type: 'Entrada', title: 'PIX Consultoria Sprint 07', account: 'Banco Inter PJ', amount: '+ R$ 8.400', time: '08h12', status: 'Conciliado' },
  { id: 2, type: 'Saída', title: 'Pagamento equipe remota', account: 'Banco Inter PJ', amount: '- R$ 6.100', time: '09h45', status: 'Em revisão' },
  { id: 3, type: 'Cartão', title: 'AWS + Vercel', account: 'Visa Infinite', amount: '- R$ 1.180', time: '12h10', status: 'Fatura' },
  { id: 4, type: 'Entrada', title: 'Mentoria Squad 08', account: 'Stripe', amount: '+ R$ 3.600', time: '15h30', status: 'Conciliado' },
]

const CATEGORY_LIMITS = [
  { id: 'operacoes', label: 'Operações', limit: 'R$ 8.000', used: 0.62 },
  { id: 'marketing', label: 'Marketing', limit: 'R$ 6.000', used: 0.48 },
  { id: 'education', label: 'Educação', limit: 'R$ 3.000', used: 0.74 },
  { id: 'pessoal', label: 'Pessoal', limit: 'R$ 4.000', used: 0.55 },
]

const GRAPH_SUMMARY = [
  { id: 'cash', label: 'Fluxo de caixa', detail: 'Receitas x despesas', value: 'R$ 7.650', progress: 0.68 },
  { id: 'growth', label: 'Meta financeira', detail: 'Meta trimestre', value: '72% atingido', progress: 0.72 },
  { id: 'runway', label: 'Runway', detail: 'Meses cobertos', value: '5.6 meses', progress: 0.56 },
]

const formatPercent = (value) => `${Math.round(value * 100)}%`

export default function Finance({ user, onNavigate }) {
  const [monthView, setMonthView] = useState('current')
  const activeMonth = useMemo(() => MONTH_VIEWS.find((view) => view.id === monthView), [monthView])

  return (
    <div className="financePage">
      <TopNav user={user} active="Financeiro" onNavigate={onNavigate} />

      <section className="financeMonths ui-card">
        <header>
          <div>
            <p>Visões mensais</p>
            <h2>Mês anterior · atual · próximo</h2>
          </div>
          <div className="financeMonths__toggle">
            {MONTH_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                className={monthView === view.id ? 'is-active' : ''}
                onClick={() => setMonthView(view.id)}
              >
                {view.period}
              </button>
            ))}
          </div>
        </header>
        <div className="financeMonths__grid">
          {MONTH_VIEWS.map((view) => (
            <article key={view.id} className={monthView === view.id ? 'is-focused' : ''}>
              <span>{view.period}</span>
              <h3>{view.label}</h3>
              <dl>
                <div>
                  <dt>Receitas</dt>
                  <dd>{view.revenue}</dd>
                </div>
                <div>
                  <dt>Despesas</dt>
                  <dd>{view.expense}</dd>
                </div>
                <div>
                  <dt>Saldo</dt>
                  <dd>{view.delta}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="financeConfigurator ui-card">
        <div className="financeConfigurator__intro">
          <div>
            <p>Cadastro e modal</p>
            <h2>Receitas/despesas com parcelamento e limites por categoria</h2>
            <p>
              Defina tipo da transação, origem bancária, conta, parcelas e categoria com limite. Tudo configurado antes do
              lançamento oficial.
            </p>
          </div>
          <div className="financeConfigurator__type">
            <button type="button" className="is-active">Receita</button>
            <button type="button">Despesa</button>
            <button type="button">Transferência</button>
          </div>
        </div>

        <div className="financeConfigurator__content">
          <div className="financeSteps">
            {TRANSACTION_STEPS.map((item) => (
              <article key={item.step}>
                <span>{item.step}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{item.highlight}</small>
                </div>
              </article>
            ))}
          </div>

          <div className="financeModalPreview">
            <div className="financeModalPreview__header">
              <p>Configuração do modal</p>
              <span>Transação parcelada</span>
            </div>
            <div className="financeModalPreview__fields">
              <article>
                <p>Conta / origem</p>
                <strong>Banco Inter PJ</strong>
                <small>Saldo atual R$ 45.120</small>
              </article>
              <article>
                <p>Categoria</p>
                <strong>Operações · SaaS</strong>
                <small>Limite mensal R$ 8k</small>
              </article>
              <article>
                <p>Parcelamento</p>
                <strong>6x · mensal</strong>
                <small>Entrada em 10 jan</small>
              </article>
              <article>
                <p>Lembretes</p>
                <strong>Notificar 2 dias antes</strong>
                <small>Enviar para Slack financeiro</small>
              </article>
            </div>
            <button type="button">Salvar transação</button>
          </div>
        </div>
      </section>

      <section className="financeCashflow">
        <article className="financeTable ui-card">
          <header>
            <div>
              <p>Receitas</p>
              <h3>Entradas confirmadas e previstas</h3>
            </div>
            <button type="button">Nova receita</button>
          </header>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Data</th>
                <th>Conta</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {REVENUE_DATA.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.date}</td>
                  <td>{row.account}</td>
                  <td>{row.amount}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="financeTable ui-card">
          <header>
            <div>
              <p>Despesas</p>
              <h3>Saídas controladas por categoria</h3>
            </div>
            <button type="button">Nova despesa</button>
          </header>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Data</th>
                <th>Conta</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_DATA.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.date}</td>
                  <td>{row.account}</td>
                  <td>{row.amount}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <section className="financeCards ui-card">
        <header>
          <div>
            <p>Cartões de crédito</p>
            <h2>Limites, fechamento e uso</h2>
          </div>
          <button type="button">Adicionar cartão</button>
        </header>
        <div className="financeCards__grid">
          {CREDIT_CARDS.map((card) => (
            <article key={card.id}>
              <div className="financeCard__head">
                <h3>{card.name}</h3>
                <span>{card.limit}</span>
              </div>
              <div className="financeCard__bar">
                <span style={{ width: formatPercent(card.used) }} />
              </div>
              <div className="financeCard__meta">
                <div>
                  <p>Utilizado</p>
                  <strong>{formatPercent(card.used)}</strong>
                </div>
                <div>
                  <p>Vencimento</p>
                  <strong>{card.due}</strong>
                </div>
                <div>
                  <p>Fechamento</p>
                  <strong>{card.closing}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="financeCharts">
        <div className="financeCharts__summary ui-card">
          {GRAPH_SUMMARY.map((chart) => (
            <article key={chart.id}>
              <p>{chart.label}</p>
              <h4>{chart.detail}</h4>
              <strong>{chart.value}</strong>
              <div className="financeCharts__bar">
                <span style={{ width: formatPercent(chart.progress) }} />
              </div>
            </article>
          ))}
        </div>

        <div className="financeLimits ui-card">
          <header>
            <div>
              <p>Limite por categoria</p>
              <h3>Configure no modal e acompanhe o uso</h3>
            </div>
            <button type="button">Editar limites</button>
          </header>
          <div className="financeLimits__list">
            {CATEGORY_LIMITS.map((category) => (
              <article key={category.id}>
                <div>
                  <strong>{category.label}</strong>
                  <span>{category.limit}</span>
                </div>
                <div className="financeLimits__bar">
                  <span style={{ width: formatPercent(category.used) }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="financeBank ui-card">
        <header>
          <div>
            <p>Movimentação bancária</p>
            <h2>Entradas e saídas conciliadas</h2>
          </div>
          <button type="button">Ver extrato completo</button>
        </header>
        <div className="financeBank__timeline">
          {BANK_ACTIVITY.map((movement) => (
            <article key={movement.id}>
              <div className="financeBank__type">{movement.type}</div>
              <div>
                <h4>{movement.title}</h4>
                <p>{movement.account}</p>
              </div>
              <div className="financeBank__amount">{movement.amount}</div>
              <div className="financeBank__meta">
                <span>{movement.time}</span>
                <small>{movement.status}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
