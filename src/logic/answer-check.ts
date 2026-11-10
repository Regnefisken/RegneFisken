/**
 * Sammenligner et indtastet svar med facit. Accepterer både komma og punktum som decimaltegn.
 * Et tomt felt er aldrig et svar (`Number('')` er 0 og ville ellers godkendes, når facit er 0).
 */
export function numericAnswerOk(user: string, expected: number): boolean {
  const text = String(user).trim().replace(',', '.');
  if (text === '') return false;
  const n = Number(text);
  if (Number.isNaN(n)) return false;
  return Math.abs(n - expected) < 0.001;
}
