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
