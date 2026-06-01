/**
 * focusLogService - Armazena log de tempo de foco por dia
 * 
 * Estrutura no localStorage:
 * {
 *   "2026-01-22": 140,  // minutos de foco
 *   "2026-01-23": 60,
 *   ...
 * }
 */

const STORAGE_KEY = 'flowapp_focus_log'

export const focusLogService = {
  /**
   * Obtém todos os logs de foco
   */
  /**
   * Obtém todos os logs de foco
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (e) {
      console.error('Erro ao ler focus log:', e)
      return {}
    }
  },

  /**
   * Adiciona tempo de foco para uma data específica
   * @param {string} dateStr - Data no formato YYYY-MM-DD
   * @param {number} minutes - Minutos a adicionar
   */
  addTime(dateStr, minutes, meta = {}) {
    if (!dateStr || !minutes || minutes <= 0) return

    try {
      const log = this.getAll()

      // Migração/Inicialização do dia
      let dayData = log[dateStr]

      // Se não existe ou é formato antigo (número), converte
      if (dayData === undefined || typeof dayData === 'number') {
        dayData = {
          total: typeof dayData === 'number' ? dayData : 0,
          hours: {},
        }
      }
      if (!dayData.categories) dayData.categories = { work: 0, study: 0 }
      if (!dayData.tasks) dayData.tasks = {}

      // Adiciona ao total
      dayData.total += minutes

      // Adiciona à hora atual
      const currentHour = new Date().getHours() // Hora local 0-23
      dayData.hours[currentHour] = (dayData.hours[currentHour] || 0) + minutes

      // Categoria (work/study) e por-tarefa
      const category = meta.category === 'study' ? 'study' : 'work'
      dayData.categories[category] = (dayData.categories[category] || 0) + minutes
      if (meta.taskId) {
        const prev = dayData.tasks[meta.taskId] || { title: meta.taskTitle || 'Tarefa', minutes: 0, category }
        prev.minutes += minutes
        prev.category = category
        if (meta.taskTitle) prev.title = meta.taskTitle
        dayData.tasks[meta.taskId] = prev
      }

      log[dateStr] = dayData

      localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
    } catch (e) {
      console.error('Erro ao salvar focus log:', e)
    }
  },

  // Helper: gera as chaves de data local dos últimos N dias (mais antiga → hoje).
  _localDateKeys(daysBack) {
    const keys = []
    const now = new Date()
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const offset = d.getTimezoneOffset()
      const local = new Date(d.getTime() - offset * 60 * 1000)
      keys.push(local.toISOString().split('T')[0])
    }
    return keys
  },

  _dayCategories(entry) {
    if (!entry || typeof entry === 'number') return { work: typeof entry === 'number' ? entry : 0, study: 0 }
    if (entry.categories) return { work: entry.categories.work || 0, study: entry.categories.study || 0 }
    // Legado sem categoria: conta tudo como produtividade
    return { work: entry.total || 0, study: 0 }
  },

  // Série por dia: [{ dateStr, label, total, work, study }]
  getDailySeries(daysBack = 7) {
    const log = this.getAll()
    const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return this._localDateKeys(daysBack).map((dateStr) => {
      const cats = this._dayCategories(log[dateStr])
      const [y, m, d] = dateStr.split('-').map(Number)
      const label = WD[new Date(y, m - 1, d).getDay()]
      return { dateStr, label, work: cats.work, study: cats.study, total: cats.work + cats.study }
    })
  },

  // Totais de categoria num range: { work, study, total }
  getCategoryTotals(daysBack = 7) {
    const series = this.getDailySeries(daysBack)
    return series.reduce(
      (acc, d) => ({ work: acc.work + d.work, study: acc.study + d.study, total: acc.total + d.total }),
      { work: 0, study: 0, total: 0 },
    )
  },

  // Tarefas agregadas no range, ordenadas por tempo desc: [{ taskId, title, minutes, category }]
  getTaskTotals(daysBack = 7) {
    const log = this.getAll()
    const agg = {}
    for (const dateStr of this._localDateKeys(daysBack)) {
      const entry = log[dateStr]
      if (!entry || typeof entry === 'number' || !entry.tasks) continue
      for (const [taskId, t] of Object.entries(entry.tasks)) {
        if (!agg[taskId]) agg[taskId] = { taskId, title: t.title, minutes: 0, category: t.category || 'work' }
        agg[taskId].minutes += t.minutes || 0
        if (t.title) agg[taskId].title = t.title
      }
    }
    return Object.values(agg).sort((a, b) => b.minutes - a.minutes)
  },

  /**
   * Obtém tempo total de foco para uma data específica
   * @param {string} dateStr - Data no formato YYYY-MM-DD
   */
  getTimeForDate(dateStr) {
    const log = this.getAll()
    const entry = log[dateStr]

    if (typeof entry === 'number') return entry
    if (entry && entry.total) return entry.total
    return 0
  },

  /**
   * Obtém detalhamento por hora para uma data específica
   * @param {string} dateStr 
   * @returns {object} { "0": 10, "1": 0, ... }
   */
  getHoursForDate(dateStr) {
    const log = this.getAll()
    const entry = log[dateStr]

    if (!entry) return {}
    // Se for legado (número), não temos horas, retornamos vazio
    if (typeof entry === 'number') return {}

    return entry.hours || {}
  },

  /**
   * Obtém tempo de foco para um range de datas
   * @param {number} daysBack - Quantidade de dias para trás
   */
  getTimeForRange(daysBack = 7) {
    const log = this.getAll()
    const result = {}
    const now = new Date()

    // Helper simples para local date, similar ao usado em outros lugares se necessario,
    // mas aqui mantemos consistencia com o dateStr passado
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      // Nota: Aqui idealmente usariamos a mesma logica de local date do caller
      // Mas por enquanto mantemos ISO split para compatibilidade com chaves existentes
      // Se mudarmos a chave no caller, aqui tambem deve mudar.
      // Assumindo que o caller (Tasks.jsx) vai passar a usar Local Date, as chaves mudarão.
      // Entao aqui precisamos gerar chaves compativeis.
      // Vamos usar offset para garantir consistency se o caller tambem usar.
      const offset = date.getTimezoneOffset()
      const localDate = new Date(date.getTime() - (offset * 60 * 1000))
      const dateStr = localDate.toISOString().split('T')[0]

      const entry = log[dateStr]
      let val = 0
      if (typeof entry === 'number') val = entry
      else if (entry && entry.total) val = entry.total

      result[dateStr] = val
    }

    return result
  },

  /**
   * Limpa logs antigos (mais de 60 dias)
   */
  cleanup() {
    try {
      const log = this.getAll()
      const now = new Date()
      const cutoffDate = new Date(now)
      cutoffDate.setDate(cutoffDate.getDate() - 60)
      const cutoffStr = cutoffDate.toISOString().split('T')[0]

      const cleaned = {}
      Object.entries(log).forEach(([dateStr, entry]) => {
        if (dateStr >= cutoffStr) {
          cleaned[dateStr] = entry
        }
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    } catch (e) {
      console.error('Erro ao limpar focus log:', e)
    }
  }
}
