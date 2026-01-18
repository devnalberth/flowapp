const { error } = await supabase
  .from('goals')
  .insert([
    {
      // Certifique-se de que todos os campos obrigatórios estão presentes e corretos
      title: goal.title,
      deadline: isValidDate(goal.deadline) ? goal.deadline : null,
      // ...outros campos...
    }
  ]);
if (error) {
  throw error;
}