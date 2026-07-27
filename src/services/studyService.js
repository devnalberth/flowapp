import { supabase } from '../lib/supabaseClient.js'

const getOrderValue = (item) => {
  if (typeof item?.order_index === 'number') return item.order_index
  if (typeof item?.position === 'number') return item.position
  return Number.MAX_SAFE_INTEGER
}

const compareByVisualOrder = (a, b) => {
  const orderA = getOrderValue(a)
  const orderB = getOrderValue(b)
  if (orderA !== orderB) return orderA - orderB

  const dateA = a?.created_at ? new Date(a.created_at).getTime() : Number.MAX_SAFE_INTEGER
  const dateB = b?.created_at ? new Date(b.created_at).getTime() : Number.MAX_SAFE_INTEGER
  if (dateA !== dateB) return dateA - dateB

  return String(a?.title || '').localeCompare(String(b?.title || ''), 'pt-BR')
}

const normalizeResources = (input) => {
  if (!Array.isArray(input)) return []
  return input
    .map((item, index) => {
      if (typeof item === 'string') return { id: `res-${index}`, label: item, url: item }
      if (!item || typeof item !== 'object') return null
      return {
        id: item.id || `res-${index}`,
        label: item.label || item.title || item.url || '',
        url: item.url || '',
      }
    })
    .filter((r) => r && (r.url || r.label))
}

const toInt = (value) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

// Um bloco = módulo ou sub-módulo. Ambos guardam o mesmo contador de aulas.
const normalizeBlock = (module) => {
  const total = toInt(module?.lessons_total ?? module?.lessonsTotal)
  const parentModuleId = module?.parent_module_id ?? module?.parentModuleId ?? null
  return {
    ...module,
    parentModuleId,
    kind: parentModuleId ? 'submodule' : 'module',
    description: module?.description ?? null,
    lessonsTotal: total,
    lessonsDone: Math.min(toInt(module?.lessons_done ?? module?.lessonsDone), total),
    scheduledDate: module?.scheduled_date ?? module?.scheduledDate ?? null,
    scheduledTime: module?.scheduled_time ?? module?.scheduledTime ?? null,
    priority: module?.priority ?? null,
    taskId: module?.task_id ?? module?.taskId ?? null,
    notes: module?.notes ?? null,
    rating: module?.rating ?? null,
    resources: normalizeResources(module?.resources),
    submodules: [],
  }
}

// Monta a árvore com no máximo 2 níveis: módulo → sub-módulo.
// Qualquer linha mais funda que isso (resquício do modelo antigo de matérias)
// é reancorada no módulo raiz mais próximo em vez de sumir da tela.
const buildModuleTree = (modules) => {
  const blocks = (Array.isArray(modules) ? modules : []).map(normalizeBlock)
  const byId = new Map(blocks.map((block) => [block.id, block]))

  const rootModuleOf = (block, guard = 0) => {
    if (!block?.parentModuleId || guard > 10) return block
    const parent = byId.get(block.parentModuleId)
    if (!parent) return block
    return rootModuleOf(parent, guard + 1)
  }

  const roots = []
  blocks.forEach((block) => {
    if (!block.parentModuleId || !byId.has(block.parentModuleId)) {
      block.parentModuleId = null
      block.kind = 'module'
      roots.push(block)
      return
    }
    const anchor = rootModuleOf(block)
    if (anchor === block) {
      roots.push(block)
      return
    }
    block.parentModuleId = anchor.id
    block.kind = 'submodule'
    anchor.submodules.push(block)
  })

  roots.sort(compareByVisualOrder)
  roots.forEach((root) => root.submodules.sort(compareByVisualOrder))

  return roots
}

export const studyService = {
  // Upload de imagem de capa para o Supabase Storage
  async uploadCoverImage(file, userId) {
    if (!file || !userId) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('study-covers')
      .upload(fileName, file)

    if (error) {
      console.error('Error uploading cover image:', error)
      // Se o bucket não existir, retorna null graciosamente
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        console.warn('Bucket may not exist. Cover upload skipped.')
        return null
      }
      throw error
    }

    // Gera URL pública
    const { data: urlData } = supabase.storage
      .from('study-covers')
      .getPublicUrl(fileName)

    return urlData?.publicUrl || null
  },

  async getStudies(userId) {
    if (!userId) {
      console.log('No userId provided to getStudies')
      return []
    }

    const { data, error } = await supabase
      .from('study_items')
      .select(
        `
        *,
        modules:study_modules(*)
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching studies:', error)
      return []
    }

    // Normaliza snake_case do banco para camelCase do frontend
    return (data || []).map(study => ({
      ...study,
      modules: buildModuleTree(study.modules || []),
      coverUrl: study.cover_url || null,
      createdAt: study.created_at,
      updatedAt: study.updated_at,
    }))
  },

  async createStudy(userId, studyData) {
    const { data, error } = await supabase
      .from('study_items')
      .insert([
        {
          user_id: userId,
          title: studyData.title,
          type: studyData.type,
          category: studyData.category || null,
          status: studyData.status || 'NOT_STARTED',
          url: studyData.url || null,
          cover_url: studyData.coverUrl,
          description: studyData.description || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating study:', error)
      throw error
    }

    return data
  },

  async updateStudy(studyId, updates) {
    const { data, error } = await supabase
      .from('study_items')
      .update({
        title: updates.title,
        type: updates.type,
        category: updates.category,
        status: updates.status,
        url: updates.url,
        cover_url: updates.coverUrl,
        description: updates.description,
      })
      .eq('id', studyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating study:', error)
      throw error
    }

    return data
  },

  async deleteStudy(studyId) {
    const { error } = await supabase.from('study_items').delete().eq('id', studyId)

    if (error) {
      console.error('Error deleting study:', error)
      throw error
    }
  },

  async createModule(studyItemId, moduleData) {
    const parentModuleId = moduleData.parentModuleId || null
    const total = toInt(moduleData.lessonsTotal)
    const { data, error } = await supabase
      .from('study_modules')
      .insert([
        {
          study_item_id: studyItemId,
          title: moduleData.title,
          parent_module_id: parentModuleId,
          kind: parentModuleId ? 'submodule' : 'module',
          description: moduleData.description || null,
          lessons_total: total,
          lessons_done: Math.min(toInt(moduleData.lessonsDone), total),
          scheduled_date: moduleData.scheduledDate || null,
          scheduled_time: moduleData.scheduledTime || null,
          priority: moduleData.priority || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating module:', error)
      throw error
    }

    return normalizeBlock(data)
  },

  async updateModule(moduleId, updates) {
    const parentModuleId = updates.parentModuleId ?? updates.parent_module_id
    const payload = {
      title: updates.title,
      description: updates.description,
      notes: updates.notes,
      rating: updates.rating,
      resources: updates.resources,
      lessons_total: updates.lessonsTotal ?? updates.lessons_total,
      lessons_done: updates.lessonsDone ?? updates.lessons_done,
      scheduled_date: updates.scheduledDate ?? updates.scheduled_date,
      scheduled_time: updates.scheduledTime ?? updates.scheduled_time,
      priority: updates.priority,
      task_id: updates.taskId ?? updates.task_id,
      parent_module_id: parentModuleId,
    }
    // Mover um bloco muda o que ele é: sem pai vira módulo, com pai vira sub-módulo.
    if (parentModuleId !== undefined) payload.kind = parentModuleId ? 'submodule' : 'module'
    if (payload.lessons_total !== undefined) payload.lessons_total = toInt(payload.lessons_total)
    if (payload.lessons_done !== undefined) payload.lessons_done = toInt(payload.lessons_done)

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

    const { data, error } = await supabase
      .from('study_modules')
      .update(payload)
      .eq('id', moduleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating module:', error)
      throw error
    }

    return normalizeBlock(data)
  },

  // Grava o contador de aulas do bloco (o medidor da tela de estudos).
  async setBlockCounter(moduleId, { lessonsDone, lessonsTotal }) {
    const payload = {}
    if (lessonsTotal !== undefined) payload.lessons_total = toInt(lessonsTotal)
    if (lessonsDone !== undefined) payload.lessons_done = toInt(lessonsDone)
    if (payload.lessons_total !== undefined && payload.lessons_done !== undefined) {
      payload.lessons_done = Math.min(payload.lessons_done, payload.lessons_total)
    }

    const { data, error } = await supabase
      .from('study_modules')
      .update(payload)
      .eq('id', moduleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating block counter:', error)
      throw error
    }

    return normalizeBlock(data)
  },

  async deleteModule(moduleId) {
    const { error } = await supabase
      .from('study_modules')
      .delete()
      .eq('id', moduleId)

    if (error) {
      console.error('Error deleting module:', error)
      throw error
    }
  }
}
