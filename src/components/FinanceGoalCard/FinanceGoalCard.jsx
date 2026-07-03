import { useMemo } from 'react'
import { Target, Plus, Pencil, TrendingUp, CheckCircle2 } from 'lucide-react'
import CategoryIcon from '../CategoryIcon/CategoryIcon.jsx'
import './FinanceGoalCard.css'

const fmtMoney = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(n) || 0)

// Soma das receitas da categoria vinculada dentro das transações do mês.
function categoryRevenue(transactions, slug) {
  return (transactions || [])
    .filter((t) => (t.type || '').toUpperCase() === 'RECEITA' && t.category === slug)
    .reduce((s, t) => s + (Number(t.amount) || 0), 0)
}

export default function FinanceGoalCard({ goals = [], transactions = [], catMap = {}, hideValues = false, monthLabel = '', onCreate, onEdit }) {
  // Preferência global "ocultar valores financeiros"
  const money = (n) => (hideValues ? 'R$ ••••' : fmtMoney(n))
  const items = useMemo(() => {
    return (goals || [])
      .filter((g) => g.financeCategory && (g.financeTarget || 0) > 0)
      .map((g) => {
        const current = categoryRevenue(transactions, g.financeCategory)
        const target = Number(g.financeTarget) || 0
        const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0
        const reached = current >= target && target > 0
        return { ...g, current, target, pct, reached }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [goals, transactions])

  return (
    <section className="financeGoals ui-card">
      <header className="financeGoals__head">
        <div className="financeGoals__title">
          <span className="financeGoals__badge"><Target size={15} /></span>
          <div>
            <p>Metas financeiras</p>
            <h3>Faturamento previsto · {monthLabel}</h3>
          </div>
        </div>
        <button type="button" className="financeGoals__add" onClick={onCreate}>
          <Plus size={14} /> Meta
        </button>
      </header>

      {items.length === 0 ? (
        <button type="button" className="financeGoals__empty" onClick={onCreate}>
          <Target size={18} />
          <span>Defina uma meta de faturamento por categoria (ex.: <strong>R$ 10.000 com WebDesign/mês</strong>) e acompanhe o progresso aqui.</span>
        </button>
      ) : (
        <div className="financeGoals__grid">
          {items.map((g) => {
            const cat = catMap[g.financeCategory] || {}
            const accent = cat.color || '#16a34a'
            return (
              <article
                key={g.id}
                className={`financeGoalItem ${g.reached ? 'is-reached' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onEdit?.(g)}
                onKeyDown={(e) => { if (e.key === 'Enter') onEdit?.(g) }}
                style={{ '--accent': accent }}
              >
                <header className="financeGoalItem__head">
                  <span className="financeGoalItem__cat">
                    <CategoryIcon slug={g.financeCategory} icon={cat.icon} color={accent} size={22} />
                    {cat.name || g.financeCategory}
                  </span>
                  <Pencil size={13} className="financeGoalItem__edit" />
                </header>

                <strong className="financeGoalItem__name">{g.title}</strong>

                <div className="financeGoalItem__values">
                  <span className="financeGoalItem__current">{money(g.current)}</span>
                  <span className="financeGoalItem__target">de {money(g.target)}</span>
                </div>

                <div className="financeGoalItem__bar">
                  <span style={{ width: `${g.pct}%` }} />
                </div>

                <footer className="financeGoalItem__foot">
                  {g.reached ? (
                    <span className="financeGoalItem__tag is-reached"><CheckCircle2 size={13} /> Meta batida</span>
                  ) : (
                    <span className="financeGoalItem__tag"><TrendingUp size={13} /> {g.pct}% do alvo</span>
                  )}
                  <span className="financeGoalItem__remain">
                    {g.reached ? `+${money(g.current - g.target)}` : `faltam ${money(g.target - g.current)}`}
                  </span>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
