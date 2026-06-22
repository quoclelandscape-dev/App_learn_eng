export interface WordDiff {
  text: string;
  type: 'correct' | 'incorrect' | 'missing';
}

export function cleanWord(word: string): string {
  // Remove punctuation and convert to lowercase for comparison
  return word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\[\]"""''…]/g, "").trim();
}

/**
 * Map of common English contractions to their expanded forms.
 * Keys are the cleaned (lowercase, no punctuation) contraction.
 * Values are arrays of the expanded words (already lowercase).
 */
const CONTRACTION_MAP: Record<string, string[]> = {
  // be contractions
  "im": ["i", "am"],
  "youre": ["you", "are"],
  "hes": ["he", "is"],
  "shes": ["she", "is"],
  "its": ["it", "is"],   // note: "its" (possessive) vs "it's" (it is) - after cleaning both become "its"
  "were": ["we", "are"],
  "theyre": ["they", "are"],
  "thats": ["that", "is"],
  "theres": ["there", "is"],
  "heres": ["here", "is"],
  "whats": ["what", "is"],
  "whos": ["who", "is"],
  "wheres": ["where", "is"],
  "whens": ["when", "is"],
  "whys": ["why", "is"],
  "hows": ["how", "is"],

  // not contractions
  "isnt": ["is", "not"],
  "arent": ["are", "not"],
  "wasnt": ["was", "not"],
  "werent": ["were", "not"],
  "hasnt": ["has", "not"],
  "havent": ["have", "not"],
  "hadnt": ["had", "not"],
  "doesnt": ["does", "not"],
  "dont": ["do", "not"],
  "didnt": ["did", "not"],
  "wont": ["will", "not"],
  "wouldnt": ["would", "not"],
  "shouldnt": ["should", "not"],
  "couldnt": ["could", "not"],
  "cant": ["can", "not"],
  "cannot": ["can", "not"],
  "mustnt": ["must", "not"],
  "neednt": ["need", "not"],

  // have contractions
  "ive": ["i", "have"],
  "youve": ["you", "have"],
  "weve": ["we", "have"],
  "theyve": ["they", "have"],
  "couldve": ["could", "have"],
  "wouldve": ["would", "have"],
  "shouldve": ["should", "have"],
  "mightve": ["might", "have"],
  "mustve": ["must", "have"],

  // will/shall contractions
  "ill": ["i", "will"],
  "youll": ["you", "will"],
  "hell": ["he", "will"],
  "shell": ["she", "will"],
  "itll": ["it", "will"],
  "well": ["we", "will"],
  "theyll": ["they", "will"],
  "thatll": ["that", "will"],

  // would/had contractions  
  "id": ["i", "would"],
  "youd": ["you", "would"],
  "hed": ["he", "would"],
  "shed": ["she", "would"],
  "wed": ["we", "would"],
  "theyd": ["they", "would"],
  "itd": ["it", "would"],

  // common informal
  "lets": ["let", "us"],
  "aint": ["am", "not"],
  "gonna": ["going", "to"],
  "wanna": ["want", "to"],
  "gotta": ["got", "to"],
  "kinda": ["kind", "of"],
  "sorta": ["sort", "of"],
  "dunno": ["do", "not", "know"],
  "lemme": ["let", "me"],
  "gimme": ["give", "me"],
};

/**
 * Expand a single cleaned word into its contraction components if applicable.
 * e.g., "theyre" -> ["they", "are"], "hello" -> ["hello"]
 */
function expandWord(cleanedWord: string): string[] {
  return CONTRACTION_MAP[cleanedWord] || [cleanedWord];
}

/**
 * Represents a word or group of words in the original text
 * that maps to one or more normalized (expanded) words.
 */
interface WordToken {
  /** The original text as it appears in the sentence */
  originalText: string;
  /** The expanded/normalized words for comparison */
  expandedWords: string[];
}

/**
 * Tokenize a sentence into WordTokens, expanding contractions.
 * Each original word becomes a WordToken with its expanded form.
 */
function tokenize(sentence: string, rawWords: string[]): WordToken[] {
  return rawWords.map(w => ({
    originalText: w,
    expandedWords: expandWord(cleanWord(w))
  }));
}

/**
 * Flatten tokens into a sequence of expanded words,
 * each remembering which original token it came from.
 */
interface ExpandedEntry {
  word: string;
  tokenIndex: number;
}

function flattenTokens(tokens: WordToken[]): ExpandedEntry[] {
  const result: ExpandedEntry[] = [];
  tokens.forEach((token, idx) => {
    for (const w of token.expandedWords) {
      result.push({ word: w, tokenIndex: idx });
    }
  });
  return result;
}

/**
 * Compares a target sentence with user input word-by-word.
 * Uses Longest Common Subsequence (LCS) on contraction-expanded words
 * to generate a detailed diff indicating correct, incorrect (extra), and missing words.
 *
 * Smart features:
 * - Contractions are equivalent to their expanded forms (They're = They are)
 * - Informal equivalences (gonna = going to, wanna = want to)
 * - Case-insensitive and punctuation-insensitive
 */
export function diffWords(target: string, input: string): WordDiff[] {
  const targetRawWords = target.trim().split(/\s+/).filter(w => cleanWord(w) !== "");
  const inputRawWords = input.trim().split(/\s+/).filter(w => cleanWord(w) !== "");

  const targetTokens = tokenize(target, targetRawWords);
  const inputTokens = tokenize(input, inputRawWords);

  const targetExpanded = flattenTokens(targetTokens);
  const inputExpanded = flattenTokens(inputTokens);

  const n = targetExpanded.length;
  const m = inputExpanded.length;

  // LCS on expanded words
  const dp: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (targetExpanded[i - 1].word === inputExpanded[j - 1].word) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matched expanded indices
  const matchedTargetExpIdx = new Set<number>();
  const matchedInputExpIdx = new Set<number>();
  {
    let i = n;
    let j = m;
    while (i > 0 && j > 0) {
      if (targetExpanded[i - 1].word === inputExpanded[j - 1].word) {
        matchedTargetExpIdx.add(i - 1);
        matchedInputExpIdx.add(j - 1);
        i--;
        j--;
      } else if (dp[i][j - 1] >= dp[i - 1][j]) {
        j--;
      } else {
        i--;
      }
    }
  }

  // Determine which original tokens are fully matched
  // A token is "correct" if ALL its expanded words are in the matched set
  const targetTokenMatched: boolean[] = targetTokens.map((token, tokenIdx) => {
    const expIndices: number[] = [];
    for (let k = 0; k < targetExpanded.length; k++) {
      if (targetExpanded[k].tokenIndex === tokenIdx) expIndices.push(k);
    }
    return expIndices.length > 0 && expIndices.every(k => matchedTargetExpIdx.has(k));
  });

  const inputTokenMatched: boolean[] = inputTokens.map((token, tokenIdx) => {
    const expIndices: number[] = [];
    for (let k = 0; k < inputExpanded.length; k++) {
      if (inputExpanded[k].tokenIndex === tokenIdx) expIndices.push(k);
    }
    return expIndices.length > 0 && expIndices.every(k => matchedInputExpIdx.has(k));
  });

  // Build diff from original tokens using greedy two-pointer alignment
  const diffs: WordDiff[] = [];
  let ti = 0; // index into targetTokens
  let ii = 0; // index into inputTokens

  while (ti < targetTokens.length || ii < inputTokens.length) {
    if (ti >= targetTokens.length) {
      // Remaining input words are extra (incorrect)
      diffs.push({ text: inputTokens[ii].originalText, type: 'incorrect' });
      ii++;
    } else if (ii >= inputTokens.length) {
      // Remaining target words are missing
      diffs.push({ text: targetTokens[ti].originalText, type: 'missing' });
      ti++;
    } else if (targetTokenMatched[ti] && inputTokenMatched[ii]) {
      // Both matched — they correspond to each other
      // Use the target's original text (to show what was expected)
      diffs.push({ text: targetTokens[ti].originalText, type: 'correct' });
      ti++;
      ii++;
    } else if (!targetTokenMatched[ti] && !inputTokenMatched[ii]) {
      // Neither matched — emit the target as missing and input as incorrect
      diffs.push({ text: targetTokens[ti].originalText, type: 'missing' });
      diffs.push({ text: inputTokens[ii].originalText, type: 'incorrect' });
      ti++;
      ii++;
    } else if (!targetTokenMatched[ti]) {
      // Target word is unmatched (missing from user input)
      diffs.push({ text: targetTokens[ti].originalText, type: 'missing' });
      ti++;
    } else {
      // Input word is unmatched (extra word typed by user)
      diffs.push({ text: inputTokens[ii].originalText, type: 'incorrect' });
      ii++;
    }
  }

  return diffs;
}

/**
 * Calculates the percentage of matching words.
 * Uses contraction-aware diffing for accurate scoring.
 */
export function calculateAccuracy(target: string, input: string): number {
  const diffs = diffWords(target, input);
  if (diffs.length === 0) return 0;

  const correctCount = diffs.filter(d => d.type === 'correct').length;
  const targetWords = target.trim().split(/\s+/).filter(w => cleanWord(w) !== "").length;

  if (targetWords === 0) return 0;
  return Math.round((correctCount / targetWords) * 100);
}
