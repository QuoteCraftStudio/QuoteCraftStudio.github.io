// Workers AI only. Passing this screen never publishes a discussion or reply.
export const SAFETY_MODEL = '@cf/meta/llama-guard-3-8b';
export class ScreeningError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
const unavailable = () => new ScreeningError('Content screening is temporarily unavailable. Your changes were not saved. Please try again later.', 503);
const prohibited = () => new ScreeningError('Please revise this content to follow the Community Guidelines. Avoid profanity, abusive language, threats, and spam. If this seems mistaken, contact Account support.', 400);

// Conservative whole-word rules supplement the safety model, not a claim of
// exhaustive detection. Do not match innocent substrings such as "class".
export function clearlyProhibited(text) {
  const normalized = text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();
  return /\b(?:fuck(?:ing|ed|er|ers)?|shit(?:ty|head)?|bullshit|asshole|bitch(?:es)?)\b/u.test(normalized)
    || /^\s*you(?:'re| are)\s+(?:an?\s+)?(?:idiot|moron|imbecile)\b/u.test(normalized)
    || /^\s*(?:guaranteed profits?|get rich quick|click here to win|buy followers)\b/u.test(normalized);
}

// Never accept a leading "safe" followed by contradictory/generated prose.
export function parseSafetyResponse(result) {
  const answer = result?.response;
  if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
    if (!Array.isArray(answer.categories) || !answer.categories.every(x => typeof x === 'string' && /^S(?:[1-9]|1[0-4])$/.test(x))) return 'unavailable';
    if (answer.safe === true && answer.categories.length === 0) return 'safe';
    if (answer.safe === false) return 'unsafe';
    return 'unavailable';
  }
  if (typeof answer !== 'string') return 'unavailable';
  const value = answer.trim();
  if (value === 'safe') return 'safe';
  if (/^unsafe(?:\s+S(?:[1-9]|1[0-4])(?:\s*,\s*S(?:[1-9]|1[0-4]))*)?$/.test(value)) return 'unsafe';
  return 'unavailable';
}

export async function checkContentSafety(env, fields, {timeoutMs = 20000} = {}) {
  if (!Array.isArray(fields) || !fields.length || fields.some(x => typeof x !== 'string') || fields.join('\n').length > 5121) throw unavailable();
  // Screen fields independently against deterministic rules to prevent a title
  // or name being hidden by a benign body. Only public text goes to Workers AI.
  if (fields.some(clearlyProhibited)) throw prohibited();
  if (typeof env.AI?.run !== 'function') throw unavailable();
  let timer;
  try {
    const result = await Promise.race([
      env.AI.run(SAFETY_MODEL, {messages: [{role: 'user', content: fields.join('\n\n')}], max_tokens: 64, temperature: 0}),
      new Promise((_, reject) => { timer = setTimeout(() => reject(unavailable()), timeoutMs); })
    ]);
    const verdict = parseSafetyResponse(result);
    if (verdict === 'unsafe') throw prohibited();
    if (verdict !== 'safe') throw unavailable();
  } catch (error) {
    // Never return provider payloads, input text, credentials, or private data.
    if (error instanceof ScreeningError) throw error;
    throw unavailable();
  } finally { clearTimeout(timer); }
}
