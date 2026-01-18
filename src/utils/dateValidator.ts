export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  // Verifica se o dia é válido para o mês
  return day <= new Date(year, month, 0).getDate();
}
