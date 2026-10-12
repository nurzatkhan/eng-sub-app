export type SavedWord = {
  /** normalized (lowercase) */
  word: string;
  translation: string;
  /** subtitle line the word was saved from */
  context: string;
  addedAt: number;
};
