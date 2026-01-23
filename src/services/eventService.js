import { getSupabaseClient } from '../lib/supabaseClient';

const normalizeEvent = (event) => ({
  ...event,
  // Normaliza campos para uso no frontend
  date: event.date,
  time: event.time || null,
  endTime: event.end_time,
  isAllDay: event.is_all_day,
  reminderMinutes: event.reminder_minutes,
});

export const eventService = {
  async getEvents(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(normalizeEvent);
  },

  async createEvent(userId, event) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time || null,
        end_time: event.endTime || null,
        location: event.location,
        color: event.color || '#ff6a00',
        reminder_minutes: event.reminderMinutes || 30,
        is_all_day: event.isAllDay || false,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return normalizeEvent(data);
  },

  async updateEvent(eventId, userId, updates) {
    const supabase = getSupabaseClient(true);

    const payload = {
      title: updates.title,
      description: updates.description,
      date: updates.date,
      time: updates.time,
      end_time: updates.endTime,
      location: updates.location,
      color: updates.color,
      reminder_minutes: updates.reminderMinutes,
      is_all_day: updates.isAllDay,
      updated_at: new Date().toISOString(),
    };

    // Remove chaves undefined
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return normalizeEvent(data);
  },

  async deleteEvent(eventId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
