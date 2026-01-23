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
  addTime(dateStr, minutes) {
    if (!dateStr || !minutes || minutes <= 0) return

    try {
      const log = this.getAll()
      log[dateStr] = (log[dateStr] || 0) + minutes
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
      console.log(`Focus Log: +${minutes.toFixed(1)}min em ${dateStr}. Total do dia: ${log[dateStr].toFixed(1)}min`)
    } catch (e) {
      console.error('Erro ao salvar focus log:', e)
    }
  },

  /**
   * Obtém tempo de foco para uma data específica
   * @param {string} dateStr - Data no formato YYYY-MM-DD
   */
  getTimeForDate(dateStr) {
    const log = this.getAll()
    return log[dateStr] || 0
  },

  /**
   * Obtém tempo de foco para um range de datas
   * @param {number} daysBack - Quantidade de dias para trás
   */
  getTimeForRange(daysBack = 7) {
    const log = this.getAll()
    const result = {}
    const now = new Date()

    for (let i = 0; i < daysBack; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      result[dateStr] = log[dateStr] || 0
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
      Object.entries(log).forEach(([dateStr, minutes]) => {
        if (dateStr >= cutoffStr) {
          cleaned[dateStr] = minutes
        }
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    } catch (e) {
      console.error('Erro ao limpar focus log:', e)
    }
  }
}
