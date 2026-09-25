import mammoth from 'mammoth';

export interface RawParsedQuestion {
  questionNumber?: number;
  questionText: string;
  options: {
    key: string;
    text: string;
  }[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' or empty / invalid
  rawText?: string;
  validationErrors?: string[];
  isValid: boolean;
  isDuplicate?: boolean;
  duplicateOf?: string;
  categoryHint?: string;
}

export interface ParseResult {
  fileName: string;
  fileType: string;
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  questions: RawParsedQuestion[];
  rawExtractedText: string;
}

/**
 * Extracts raw plain text from PDF or DOCX buffers.
 */
export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType.includes('docx') || normalizedType.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (normalizedType.includes('pdf') || normalizedType.endsWith('.pdf')) {
    // Dynamic import to avoid next.js bundling issues
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer);
    return data.text;
  }

  throw new Error(`Unsupported file type: ${fileType}. Only PDF and DOCX files are supported.`);
}

/**
 * Parses raw text into structured question blocks.
 * Supports inline answers and end-of-document Answer Key tables.
 */
export function parseQuestionsFromText(text: string, fileName = 'document'): ParseResult {
  // Normalize line endings and whitespace
  let normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip page markers e.g. "Page 1", "--- Page 2 ---"
  normalizedText = normalizedText.replace(/(?:^|\n)\s*(?:Page\s+\d+|---\s*Page\s*\d+\s*---)\s*(?:\n|$)/gi, '\n');

  // Check if there is an Answer Key section at the end
  const { contentText, answerKeyMap } = extractAnswerKeySection(normalizedText);

  // Split into question candidate blocks
  const rawBlocks = splitIntoQuestionBlocks(contentText);

  const parsedQuestions: RawParsedQuestion[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const parsed = parseSingleQuestionBlock(block, i + 1, answerKeyMap);
    if (parsed) {
      validateParsedQuestion(parsed);
      parsedQuestions.push(parsed);
    }
  }

  const validCount = parsedQuestions.filter((q) => q.isValid).length;
  const invalidCount = parsedQuestions.length - validCount;

  return {
    fileName,
    fileType: fileName.split('.').pop() || 'unknown',
    totalQuestions: parsedQuestions.length,
    validQuestions: validCount,
    invalidQuestions: invalidCount,
    questions: parsedQuestions,
    rawExtractedText: normalizedText.slice(0, 5000), // snippet for debugging
  };
}

/**
 * Detects and extracts an "ANSWER KEY" section at the end of the text.
 */
function extractAnswerKeySection(text: string): {
  contentText: string;
  answerKeyMap: Map<number, string>;
} {
  const answerKeyMap = new Map<number, string>();

  // Look for ANSWER KEY / ANSWERS headers (with optional "& Explanations", "and Solutions", etc.)
  const headerRegex =
    /(?:^|\n)\s*(?:(?:ANSWER\s*KEY|ANSWERS|CORRECT\s*ANSWERS|SOLUTIONS)(?:\s*(?:&|and)\s*[\w\s]+)?)\s*[:\-]?\s*(?:\n|$)/i;
  const match = text.match(headerRegex);

  if (!match || match.index === undefined) {
    return { contentText: text, answerKeyMap };
  }

  const contentText = text.substring(0, match.index).trim();
  const answerKeyBlock = text.substring(match.index).trim();

  // Pattern 1: Regex with lookahead to match question numbers and answers
  // e.g., "1. Answer: (C) 120", "1. B", "Q1: C", "1) Ans: A", "1. A  2. B  3. C"
  const pairPattern =
    /(?:^|\s)(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\:\s\-]+(?:Answer|Ans)?[\s\:\-\.]*\(?([A-D])\)?(?=[^a-zA-Z]|$)/gi;
  let numMatch;

  while ((numMatch = pairPattern.exec(answerKeyBlock)) !== null) {
    const qNum = parseInt(numMatch[1], 10);
    const key = numMatch[2].toUpperCase();
    if (!answerKeyMap.has(qNum)) {
      answerKeyMap.set(qNum, key);
    }
  }

  // Fallback line-by-line if needed
  if (answerKeyMap.size === 0) {
    const lines = answerKeyBlock.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const m = trimmed.match(/^(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\:\s\-]+(?:Answer|Ans)?[\s\:\-\.]*\(?([A-D])\)?/i);
      if (m) {
        const qNum = parseInt(m[1], 10);
        const key = m[2].toUpperCase();
        if (!answerKeyMap.has(qNum)) {
          answerKeyMap.set(qNum, key);
        }
      }
    }
  }

  // Pattern 3: Sequential letters separated by newline or space if not numbered
  if (answerKeyMap.size === 0) {
    const sequentialLetters = answerKeyBlock
      .split(/[\s,;\n]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-D]$/.test(s));

    sequentialLetters.forEach((key, idx) => {
      answerKeyMap.set(idx + 1, key);
    });
  }

  return { contentText, answerKeyMap };
}

/**
 * Splits document text into individual question blocks based on standard question prefixes.
 */
function splitIntoQuestionBlocks(text: string): string[] {
  // Strip page numbers and headers like "Page 1", "--- Page 2 ---"
  const cleaned = text.replace(/(?:^|\n)\s*(?:Page\s+\d+|---\s*Page\s*\d+\s*---)\s*(?:\n|$)/gi, '\n');

  const lines = cleaned.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    // Check if this line looks like the start of a new question
    const isNewQuestion =
      /^\s*(?:(?:Question|Q)\s*\.?\s*\d+[\.\:\)\s\-]+|\d+[\.\)\-]\s+)/i.test(line);

    if (isNewQuestion && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n').trim());
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n').trim());
  }

  // Filter out any empty blocks or preamble (e.g. table of contents) before first question
  return blocks.filter((b) => {
    return (
      b.length > 10 &&
      (/[A-D][\.\)\-\:]\s+/i.test(b) || /^\s*(?:Question|Q|\d+[\.\)])/i.test(b))
    );
  });
}

/**
 * Parses a single question block into questionText, options (A, B, C, D), and correctAnswer.
 */
function parseSingleQuestionBlock(
  block: string,
  fallbackIndex: number,
  answerKeyMap: Map<number, string>
): RawParsedQuestion | null {
  if (!block || block.trim().length === 0) return null;

  // Extract Question Number if present
  let questionNumber = fallbackIndex;
  const numMatch = block.match(/^\s*(?:(?:Question|Q)\s*\.?\s*)?(\d+)[\.\:\)\s\-]+/i);
  if (numMatch) {
    questionNumber = parseInt(numMatch[1], 10);
  }

  // Remove the question number prefix from the question text
  let cleanedBlock = block.replace(
    /^\s*(?:(?:Question|Q)\s*\.?\s*)?\d+[\.\:\)\s\-]+\s*/i,
    ''
  );

  // Check for inline answer first:
  // e.g. "Answer: A", "Ans: B", "Correct Answer: C", "Answer - D", "Ans. A"
  let inlineAnswer = '';
  const inlineAnswerRegex =
    /(?:\n|^)\s*(?:(?:Correct\s*)?Answer|Ans\.?)\s*[:\-]?\s*\(?([A-D])\)?(?:\b|\.|\))/i;
  const inlineMatch = cleanedBlock.match(inlineAnswerRegex);
  if (inlineMatch) {
    inlineAnswer = inlineMatch[1].toUpperCase();
    // Remove the answer line from the block to avoid polluting options
    cleanedBlock = cleanedBlock.replace(inlineAnswerRegex, '');
  }

  // Parse Options: A, B, C, D
  // Handle forms: A., A), (A), A -, [A], Option A:
  const optionRegex =
    /(?:^|\n)\s*(?:\(?([A-D])\)|\b([A-D])[\.\:\)\-]|\bOption\s+([A-D])[\.\:\-]?)\s+/gi;

  const optionIndices: { key: string; index: number; matchLength: number }[] = [];
  let optMatch;

  while ((optMatch = optionRegex.exec(cleanedBlock)) !== null) {
    const key = (optMatch[1] || optMatch[2] || optMatch[3]).toUpperCase();
    optionIndices.push({
      key,
      index: optMatch.index,
      matchLength: optMatch[0].length,
    });
  }

  let questionText = cleanedBlock;
  const optionsMap = new Map<string, string>();

  if (optionIndices.length > 0) {
    // The question text is everything before the first option
    questionText = cleanedBlock.substring(0, optionIndices[0].index).trim();

    // Extract each option's text
    for (let i = 0; i < optionIndices.length; i++) {
      const current = optionIndices[i];
      const start = current.index + current.matchLength;
      const end =
        i + 1 < optionIndices.length ? optionIndices[i + 1].index : cleanedBlock.length;

      let optText = cleanedBlock.substring(start, end).trim();

      // For the last option (typically D), strip any trailing section heading lines
      if (i === optionIndices.length - 1) {
        const optLines = optText.split('\n');
        const cleanOptLines: string[] = [];
        for (const l of optLines) {
          const trimmed = l.trim();
          // Stop if line is a section heading e.g. "Quantitative Aptitude - Averages"
          if (
            /^(?:Quantitative|Logical|Verbal|Section|Part|General|Analytical)\b.*[-–:]/i.test(trimmed) ||
            /^Section\s+\d+/i.test(trimmed)
          ) {
            break;
          }
          cleanOptLines.push(l);
        }
        optText = cleanOptLines.join('\n').trim();
      }

      optionsMap.set(current.key, optText);
    }
  }

  // Build standard A, B, C, D options
  const keys = ['A', 'B', 'C', 'D'];
  const options = keys.map((key) => ({
    key,
    text: optionsMap.get(key) || '',
  }));

  // Resolve correct answer: inline answer takes precedence, then answerKeyMap by questionNumber, then fallbackIndex
  let correctAnswer = inlineAnswer;
  if (!correctAnswer && answerKeyMap.has(questionNumber)) {
    correctAnswer = answerKeyMap.get(questionNumber) || '';
  }
  if (!correctAnswer && answerKeyMap.has(fallbackIndex)) {
    correctAnswer = answerKeyMap.get(fallbackIndex) || '';
  }

  return {
    questionNumber,
    questionText: questionText.trim(),
    options,
    correctAnswer: correctAnswer.toUpperCase(),
    rawText: block,
    isValid: true,
  };
}

/**
 * Validates a parsed question according to strict platform criteria.
 */
export function validateParsedQuestion(q: RawParsedQuestion): void {
  const errors: string[] = [];

  if (!q.questionText || q.questionText.trim().length === 0) {
    errors.push('Question text is missing or empty.');
  }

  for (const opt of q.options) {
    if (!opt.text || opt.text.trim().length === 0) {
      errors.push(`Option ${opt.key} is missing or empty.`);
    }
  }

  if (!q.correctAnswer || !['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
    errors.push('Correct answer must be specified as A, B, C, or D.');
  } else {
    // Verify that the chosen option actually has text
    const matchedOption = q.options.find((o) => o.key === q.correctAnswer);
    if (!matchedOption || !matchedOption.text.trim()) {
      errors.push(`Correct answer points to Option ${q.correctAnswer}, which has no text.`);
    }
  }

  // Check for duplicate options (e.g. A and B having the exact same text)
  const optionTexts = q.options.map((o) => o.text.trim().toLowerCase()).filter(Boolean);
  const uniqueOptionTexts = new Set(optionTexts);
  if (optionTexts.length > 0 && uniqueOptionTexts.size < optionTexts.length) {
    errors.push('Options contain duplicate text choices.');
  }

  q.validationErrors = errors;
  q.isValid = errors.length === 0;
}
