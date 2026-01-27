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
  addTime(dateStr, minutes) {
    if (!dateStr || !minutes || minutes <= 0) return

    try {
      const log = this.getAll()

      // Migração/Inicialização do dia
      let dayData = log[dateStr]

      // Se não existe ou é formato antigo (número), converte
      if (dayData === undefined || typeof dayData === 'number') {
        dayData = {
          total: typeof dayData === 'number' ? dayData : 0,
          hours: {}
        }
      }

      // Adiciona ao total
      dayData.total += minutes

      // Adiciona à hora atual
      const currentHour = new Date().getHours() // Hora local 0-23
      dayData.hours[currentHour] = (dayData.hours[currentHour] || 0) + minutes

      log[dateStr] = dayData

      localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
      console.log(`Focus Log: +${minutes.toFixed(1)}min em ${dateStr} (Hour ${currentHour}). Total do dia: ${dayData.total.toFixed(1)}min`)
    } catch (e) {
      console.error('Erro ao salvar focus log:', e)
    }
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
