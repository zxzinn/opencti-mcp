import { encodeGeneric } from '@blackwell-systems/gcf';

// Response encoding for tool results, selected by the RESPONSE_FORMAT env var.
// 'json' (default) returns JSON; 'gcf' returns Graph Compact Format
// (https://gcformat.com). Any encoding error falls back to JSON.

export type ResponseFormat = 'json' | 'gcf';

export function getResponseFormat(env: NodeJS.ProcessEnv = process.env): ResponseFormat {
  return (env.RESPONSE_FORMAT || '').toLowerCase() === 'gcf' ? 'gcf' : 'json';
}

export function renderResult(
  value: unknown,
  format: ResponseFormat = getResponseFormat(),
): string {
  if (format === 'gcf') {
    try {
      return encodeGeneric(value as any);
    } catch {
      // fall back to JSON so a result is never dropped
    }
  }
  return JSON.stringify(value, null, 2);
}
