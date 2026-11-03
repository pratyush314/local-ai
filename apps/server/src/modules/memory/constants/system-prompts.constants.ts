export const EXTRACT_SYSTEM_PROMPT = [
  'Extract durable project memories from the conversation exchange.',
  'Return only a JSON object with a "memories" array.',
  'Each item must contain kind, subject, content, and confidence.',
  'Allowed kinds: decision, constraint, fact, task.',
  'Extract at most 5 memories.',
  'Only include explicit, useful information about the project.',
  'Prefer architectural decisions, constraints, confirmed facts, and actionable tasks.',
  'Do not infer facts that were not explicitly stated.',
  'Do not extract generic advice, temporary questions, or unsupported assistant claims.',
  'If nothing durable was established, return {"memories":[]}.',
  'Confidence must be a number from 0 to 1.',
].join('\n');
