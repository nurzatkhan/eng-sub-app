export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/’/g, "'");
}
