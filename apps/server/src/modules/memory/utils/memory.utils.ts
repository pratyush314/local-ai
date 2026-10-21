function tokenize(value: string): Set<string> {
  const stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'but',
    'by',
    'for',
    'from',
    'how',
    'i',
    'in',
    'into',
    'is',
    'it',
    'of',
    'on',
    'or',
    'our',
    'the',
    'this',
    'to',
    'was',
    'we',
    'what',
    'when',
    'where',
    'which',
    'why',
    'with',
    'you',
    'your',
  ]);

  return new Set(
    value
      .toLocaleLowerCase()
      .match(/[a-z0-9_./-]+/g)
      ?.filter((token) => token.length > 1 && !stopWords.has(token)) ?? [],
  );
}

function scoreMemory(
  queryTokens: Set<string>,
  memory: {
    kind: string;
    subject: string;
    content: string;
    confidence: number | null;
  },
): number {
  const subjectTokens = tokenize(memory.subject);
  const contentTokens = tokenize(memory.content);

  let score = 0;

  for (const token of queryTokens) {
    if (subjectTokens.has(token)) {
      score += 3;
    }

    if (contentTokens.has(token)) {
      score += 1;
    }
  }

  // Slightly prioritize explicit decisions and constraints.
  if (memory.kind === 'decision' || memory.kind === 'constraint') {
    score *= 1.1;
  }

  // Confidence is a small ranking signal, not proof of correctness.
  if (memory.confidence !== null) {
    score *= 0.9 + memory.confidence * 0.1;
  }

  return score;
}

export { scoreMemory, tokenize };
