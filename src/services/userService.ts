```typescript
async function createUser(userData) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userData.id)
    .single();
  if (existingUser) {
    throw new Error('User already exists');
  }
  // ...criação do usuário...
}
```