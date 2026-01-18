import { isValidDate } from '../utils/dateValidator';

// Certifique-se de que os nomes das tabelas estão corretos:
const studyItems = await supabase.from('study_items').select('*').order('created_at', { ascending: false });
const dreamMaps = await supabase.from('dream_maps').select('*').order('created_at', { ascending: false });

if (!isValidDate(data.date)) {
  throw new Error('Data inválida');
}