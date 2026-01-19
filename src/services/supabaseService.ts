import { supabase } from '../lib/supabaseClient';
import { isValidDate } from '../utils/dateValidator';

// Certifique-se de que os nomes das tabelas estão corretos:
const studyItems = await supabase.from('study_items').select('*').order('created_at', { ascending: false });
const dreamMaps = await supabase.from('dream_maps').select('*').order('created_at', { ascending: false });

// Substitua 'yourDateValue' pelo valor real da data que deseja validar
const yourDateValue = '2026-01-19'; // exemplo de valor, ajuste conforme necessário

if (!isValidDate(yourDateValue)) {
  throw new Error('Data inválida');
}