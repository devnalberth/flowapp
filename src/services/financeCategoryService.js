import { getSupabaseClient } from '../lib/supabaseClient';

// Categorias padrão (semeadas no 1º uso). Slugs batem com as transações antigas.
export const DEFAULT_CATEGORIES = [
  { slug: 'alimentacao', name: 'Alimentação', color: '#dc2626', icon: '🍽️', type: 'DESPESA' },
  { slug: 'assinatura', name: 'Assinatura', color: '#7c3aed', icon: '🔁', type: 'DESPESA' },
  { slug: 'casa', name: 'Casa', color: '#0891b2', icon: '🏠', type: 'DESPESA' },
  { slug: 'compras', name: 'Compras', color: '#6d28d9', icon: '🛍️', type: 'DESPESA' },
  { slug: 'educacao', name: 'Educação', color: '#4338ca', icon: '🎓', type: 'DESPESA' },
  { slug: 'lazer', name: 'Lazer', color: '#ea580c', icon: '🎮', type: 'DESPESA' },
  { slug: 'operacao_bancaria', name: 'Operação bancária', color: '#9333ea', icon: '🏦', type: 'DESPESA' },
  { slug: 'pix', name: 'Pix', color: '#8b5cf6', icon: '⚡', type: 'DESPESA' },
  { slug: 'saude', name: 'Saúde', color: '#16a34a', icon: '❤️', type: 'DESPESA' },
  { slug: 'servicos', name: 'Serviços', color: '#15803d', icon: '🛠️', type: 'DESPESA' },
  { slug: 'supermercado', name: 'Supermercado', color: '#ef4444', icon: '🛒', type: 'DESPESA' },
  { slug: 'transporte', name: 'Transporte', color: '#1d4ed8', icon: '🚗', type: 'DESPESA' },
  { slug: 'viagem', name: 'Viagem', color: '#06b6d4', icon: '✈️', type: 'DESPESA' },
  { slug: 'salario', name: 'Salário', color: '#10b981', icon: '💰', type: 'RECEITA' },
  { slug: 'freelance', name: 'Freelance', color: '#3b82f6', icon: '💻', type: 'RECEITA' },
  { slug: 'investimentos', name: 'Investimentos', color: '#a855f7', icon: '📈', type: 'RECEITA' },
  { slug: 'outros', name: 'Outros', color: '#6b7280', icon: '📦', type: 'BOTH' },
];

const normalizeCategory = (c) => (c ? { ...c, isDefault: !!c.is_default } : c);

export const financeCategoryService = {
  async getCategories(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalizeCategory);
  },

  // Semeia as categorias padrão; ignora as que já existem (unique user_id+slug).
  async seedDefaults(userId) {
    const supabase = getSupabaseClient(true);
    const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId, is_default: true }));
    const { data, error } = await supabase
      .from('finance_categories')
      .upsert(rows, { onConflict: 'user_id,slug', ignoreDuplicates: true })
      .select();
    if (error) { console.error('seedDefaults erro:', error); return []; }
    return (data || []).map(normalizeCategory);
  },

  async createCategory(userId, cat) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_categories')
      .insert({
        user_id: userId,
        slug: cat.slug,
        name: cat.name,
        color: cat.color || '#6b7280',
        icon: cat.icon || null,
        type: cat.type || 'DESPESA',
        is_default: false,
      })
      .select()
      .single();
    if (error) throw error;
    return normalizeCategory(data);
  },

  async updateCategory(id, userId, updates) {
    const supabase = getSupabaseClient(true);
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.type !== undefined) payload.type = updates.type;
    const { data, error } = await supabase
      .from('finance_categories')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return normalizeCategory(data);
  },

  async deleteCategory(id, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.from('finance_categories').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};
