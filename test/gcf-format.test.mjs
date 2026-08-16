import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeGeneric } from '@blackwell-systems/gcf';
import { renderResult, getResponseFormat } from '../build/gcf-format.js';

// decodeGeneric returns Map instances for objects; normalize to compare.
const norm = (v) =>
  v instanceof Map
    ? Object.fromEntries([...v].map(([k, x]) => [k, norm(x)]))
    : Array.isArray(v)
      ? v.map(norm)
      : v;

const records = [
  { id: 'indicator--1', name: 'a', type: 'ransomware', score: 40 },
  { id: 'indicator--2', name: 'b', type: 'trojan', score: 55 },
];

test('getResponseFormat defaults to json and reads the env var case-insensitively', () => {
  assert.equal(getResponseFormat({}), 'json');
  assert.equal(getResponseFormat({ RESPONSE_FORMAT: 'json' }), 'json');
  assert.equal(getResponseFormat({ RESPONSE_FORMAT: 'gcf' }), 'gcf');
  assert.equal(getResponseFormat({ RESPONSE_FORMAT: 'GCF' }), 'gcf');
  assert.equal(getResponseFormat({ RESPONSE_FORMAT: 'other' }), 'json');
});

test('json format returns the existing pretty-printed JSON output', () => {
  assert.equal(renderResult(records, 'json'), JSON.stringify(records, null, 2));
});

test('gcf format emits a GCF wire that round-trips losslessly', () => {
  const wire = renderResult(records, 'gcf');
  assert.ok(wire.startsWith('GCF '), 'expected a GCF header');
  assert.deepEqual(norm(decodeGeneric(wire)), records);
});

test('gcf format handles a single object result', () => {
  const report = { id: 'report--1', name: 'Q3 report', confidence: 80 };
  assert.deepEqual(norm(decodeGeneric(renderResult(report, 'gcf'))), report);
});

test('gcf falls back to JSON when it would not be smaller (never-grow)', () => {
  // A one-field object: GCF's header overhead exceeds the tiny JSON, so the
  // never-grow guard keeps the JSON rather than emit a larger wire.
  const tiny = { n: 1 };
  const out = renderResult(tiny, 'gcf');
  assert.equal(out, JSON.stringify(tiny, null, 2));
  assert.ok(!out.startsWith('GCF '), 'expected JSON fallback, not a GCF wire');
});

test('gcf verify keeps a digit-only string field as a string', () => {
  // The id values are strings that look like numbers; the encoder must quote them
  // so they decode back as strings. The round-trip verify would reject the wire and
  // fall back to JSON if they decoded as numbers instead.
  const rows = [
    { id: '1001', label: 'alpha' },
    { id: '1002', label: 'bravo' },
  ];
  const out = renderResult(rows, 'gcf');
  assert.ok(out.startsWith('GCF '), 'expected a GCF wire for a multi-row array');
  const decoded = norm(decodeGeneric(out));
  assert.equal(typeof decoded[0].id, 'string');
  assert.deepEqual(decoded, rows);
});
