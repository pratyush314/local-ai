import { ProjectMemoryKind } from '@local-ai/constants';

function tokenize(value: string): Set<string> {
  const stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'been',
    'but',
    'by',
    'can',
    'could',
    'did',
    'do',
    'does',
    'for',
    'from',
    'had',
    'has',
    'have',
    'how',
    'i',
    'if',
    'in',
    'into',
    'is',
    'it',
    'its',
    'may',
    'might',
    'my',
    'of',
    'on',
    'or',
    'our',
    'should',
    'so',
    'than',
    'that',
    'the',
    'their',
    'them',
    'there',
    'these',
    'this',
    'those',
    'to',
    'was',
    'we',
    'were',
    'what',
    'when',
    'where',
    'which',
    'who',
    'why',
    'will',
    'with',
    'would',
    'you',
    'your',
  ]);

  return new Set(
    value
      .toLowerCase()
      .match(/[a-z0-9_./-]+/g)
      ?.filter((token) => token.length > 1 && !stopWords.has(token)) ?? [],
  );
}

function scoreMemory(
  queryTokens: Set<string>,
  memory: {
    kind: ProjectMemoryKind;
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
      score += 4;
    } else if (contentTokens.has(token)) {
      score += 1;
    }
  }

  // Architectural decisions and constraints are often durable
  // and particularly useful in coding conversations.
  if (memory.kind === 'decision' || memory.kind === 'constraint') {
    score *= 1.15;
  }

  if (memory.confidence !== null) {
    score *= 0.9 + Math.max(0, Math.min(1, memory.confidence)) * 0.1;
  }

  // Normalize by query length so long questions don't automatically
  // produce higher scores simply because they contain more words.
  return queryTokens.size > 0 ? score / queryTokens.size : 0;
}

export { scoreMemory, tokenize };
