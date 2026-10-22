import type { LocalizedText } from '@praxis-buchung/config';
import { Prisma } from '../generated/prisma/client.js';

/**
 * Pass a LocalizedText to a Prisma `Json` column. Its optional `fr`/`it`/`es`
 * are `string | undefined`, which Prisma's `InputJsonValue` does not accept, so a
 * cast is unavoidable; centralizing it here keeps the write sites readable.
 */
export function toJsonInput(text: LocalizedText): Prisma.InputJsonValue {
  return text as unknown as Prisma.InputJsonValue;
}

/**
 * Narrow a Prisma JSON value read from a localized column into a LocalizedText.
 * The write paths (the seed and the validated admin DTOs) guarantee the shape;
 * this only guards against a null or legacy value, returning null so callers can
 * fall back rather than trust an unchecked cast.
 */
export function asLocalizedText(value: unknown): LocalizedText | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const map = value as Record<string, unknown>;
  if (typeof map.de !== 'string' || typeof map.en !== 'string') {
    return null;
  }
  const result: LocalizedText = { de: map.de, en: map.en };
  for (const locale of ['fr', 'it', 'es'] as const) {
    if (typeof map[locale] === 'string') {
      result[locale] = map[locale];
    }
  }
  return result;
}
