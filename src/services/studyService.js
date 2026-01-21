import { supabase } from '../lib/supabaseClient.js'

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

    return data || []
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

  async createLesson(moduleId, lessonData) {
    const { data, error } = await supabase
      .from('study_lessons')
      .insert([
        {
          module_id: moduleId,
          title: lessonData.title,
          video_url: lessonData.videoUrl,
          is_completed: lessonData.isCompleted || false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating lesson:', error)
      throw error
    }

    return data
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

    return data
  },
}
