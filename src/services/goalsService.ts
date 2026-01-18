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