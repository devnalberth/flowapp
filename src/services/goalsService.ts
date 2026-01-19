import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''
);

export async function createGoal(goal: { title: string }) {
  const { error } = await supabase
    .from('goals')
    .insert([
      {
        title: goal.title,
        // Remova ou ajuste 'end_date' se não existir
        // deadline: goal.deadline, // use o nome correto da coluna se existir
        // ...existing code...
      }
    ]);
  if (error) {
    throw error;
  }
}