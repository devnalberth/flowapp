import { isValidDate } from '../utils/dateValidator';

// Certifique-se de que os nomes das tabelas estão corretos:
const dreamMaps = await supabase.from('dream_maps').select('*');
const studyItems = await supabase.from('StudyItem').select('*');

if (!isValidDate(data.date)) {
  throw new Error('Data inválida');
}