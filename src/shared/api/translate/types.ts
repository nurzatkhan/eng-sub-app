export type DictionaryEntry = {
  /** part of speech in English, e.g. "noun" */
  pos: string;
  terms: string[];
};

export type TranslationResult = {
  text: string;
  dictionary: DictionaryEntry[];
};

export type TranslateParams = {
  text: string;
  to: string;
  /** include dictionary alternatives grouped by part of speech */
  dictionary?: boolean;
};
