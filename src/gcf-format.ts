import { encodeGeneric, decodeGeneric } from '@blackwell-systems/gcf';

// Response encoding for tool results, selected by the RESPONSE_FORMAT env var.
// 'json' (default) returns JSON; 'gcf' returns Graph Compact Format
// (https://gcformat.com). GCF is used only when it is both smaller than the JSON
// (never-grow) and decodes back to the same value (lossless); otherwise, and on
// any encoding error, the JSON is returned, so a result is never grown or garbled.

export type ResponseFormat = 'json' | 'gcf';

export function getResponseFormat(env: NodeJS.ProcessEnv = process.env): ResponseFormat {
  return (env.RESPONSE_FORMAT || '').toLowerCase() === 'gcf' ? 'gcf' : 'json';
}

export function renderResult(
  value: unknown,
  format: ResponseFormat = getResponseFormat(),
): string {
  const json = JSON.stringify(value, null, 2);
  if (format === 'gcf') {
    try {
      const wire = encodeGeneric(value as any);
      // Never-grow: only offer GCF when it is actually smaller than the JSON.
      // Lossless: require the wire to decode back to the same value, so a value the
      // encoder could mis-render is caught rather than emitted.
      if (wire.length < json.length && valuesEqual(decodeGeneric(wire), value)) {
        return wire;
      }
    } catch {
      // fall back to JSON so a result is never dropped
    }
  }
  return json;
}

// Structural equality between a gcf-decoded value (`a`, where objects are Map
// instances) and the original JS value (`b`), order-insensitive on object keys.
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Map) {
    if (b === null || typeof b !== 'object' || Array.isArray(b)) return false;
    const obj = b as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (a.size !== keys.length) return false;
    for (const k of keys) {
      if (!a.has(k) || !valuesEqual(a.get(k), obj[k])) return false;
    }
    return true;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!valuesEqual(a[i], b[i])) return false;
    }
    return true;
  }
  return a === b;
}
