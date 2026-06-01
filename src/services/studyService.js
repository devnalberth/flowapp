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

const normalizeLesson = (lesson) => ({
  ...lesson,
  isCompleted: Boolean(lesson?.is_completed ?? lesson?.isCompleted),
  videoUrl: lesson?.video_url ?? lesson?.videoUrl ?? null,
  accessUrl: lesson?.video_url ?? lesson?.videoUrl ?? lesson?.access_url ?? lesson?.accessUrl ?? null,
  scheduledDate: lesson?.scheduled_date ?? lesson?.scheduledDate ?? null,
  scheduledTime: lesson?.scheduled_time ?? lesson?.scheduledTime ?? null,
  priority: lesson?.priority ?? null,
  taskId: lesson?.task_id ?? lesson?.taskId ?? null,
  resources: normalizeResources(lesson?.resources),
})

const normalizeModule = (module) => ({
  ...module,
  parentModuleId: module?.parent_module_id ?? module?.parentModuleId ?? null,
  kind: module?.kind ?? (module?.parent_module_id ? 'subject' : 'module'),
  description: module?.description ?? null,
  lessons: Array.isArray(module?.lessons)
    ? module.lessons.map(normalizeLesson).sort(compareByVisualOrder)
    : [],
  submodules: [],
})

const buildModuleTree = (modules) => {
  const normalizedModules = (Array.isArray(modules) ? modules : []).map(normalizeModule)
  const modulesById = new Map(normalizedModules.map((module) => [module.id, module]))
  const roots = []

  normalizedModules.forEach((module) => {
    if (module.parentModuleId && modulesById.has(module.parentModuleId)) {
      modulesById.get(module.parentModuleId).submodules.push(module)
      return
    }
    roots.push(module)
  })

  const sortTree = (moduleList) => {
    moduleList.sort(compareByVisualOrder)
    moduleList.forEach((module) => {
      module.submodules.sort(compareByVisualOrder)
      module.lessons.sort(compareByVisualOrder)
      if (module.submodules.length > 0) {
        sortTree(module.submodules)
      }
    })
  }

  sortTree(roots)

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
        modules:study_modules(
          *,
          lessons:study_lessons(*)
        )
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
    const { data, error } = await supabase
      .from('study_modules')
      .insert([
        {
          study_item_id: studyItemId,
          title: moduleData.title,
          parent_module_id: moduleData.parentModuleId || null,
          kind: moduleData.kind || (moduleData.parentModuleId ? 'subject' : 'module'),
          description: moduleData.description || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating module:', error)
      throw error
    }

    return data
  },

  async updateModule(moduleId, updates) {
    const payload = {
      title: updates.title,
      description: updates.description,
      kind: updates.kind,
      parent_module_id: updates.parentModuleId ?? updates.parent_module_id,
    }
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

    return data
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
  },

  async createLesson(moduleId, lessonData) {
    const { data, error } = await supabase
      .from('study_lessons')
      .insert([
        {
          module_id: moduleId,
          title: lessonData.title,
          video_url: lessonData.videoUrl,
          is_completed: lessonData.isCompleted || false,
          scheduled_date: lessonData.scheduledDate || null,
          scheduled_time: lessonData.scheduledTime || null,
          priority: lessonData.priority || null,
          resources: lessonData.resources || [],
          description: lessonData.description || null,
          notes: lessonData.notes || null,
          rating: lessonData.rating ?? null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating lesson:', error)
      throw error
    }

    return normalizeLesson(data)
  },

  async updateLesson(lessonId, updates) {
    const payload = {
      title: updates.title,
      video_url: updates.videoUrl,
      notes: updates.notes,
      description: updates.description,
      rating: updates.rating,
      scheduled_date: updates.scheduledDate ?? updates.scheduled_date,
      scheduled_time: updates.scheduledTime ?? updates.scheduled_time,
      priority: updates.priority,
      resources: updates.resources,
      task_id: updates.taskId ?? updates.task_id,
      is_completed: updates.isCompleted ?? updates.is_completed,
    }
    // Remove undefined keys
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key])

    const { data, error } = await supabase
      .from('study_lessons')
      .update(payload)
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lesson:', error)
      throw error
    }

    return normalizeLesson(data)
  },

  async deleteLesson(lessonId) {
    const { error } = await supabase
      .from('study_lessons')
      .delete()
      .eq('id', lessonId)

    if (error) {
      console.error('Error deleting lesson:', error)
      throw error
    }
  },

  async toggleLessonComplete(lessonId, isCompleted) {
    const { data, error } = await supabase
      .from('study_lessons')
      .update({ is_completed: isCompleted })
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling lesson:', error)
      throw error
    }

    return normalizeLesson(data)
  },
}
