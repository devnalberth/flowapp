```typescript
async function createUser(userData) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userData.id)
    .single();
  if (existingUser) {
    // Trate o erro de usuário já existente
    throw new Error(`User already exists: ${userData.id}`);
  }
  // ...existing code para criar usuário...
}
```