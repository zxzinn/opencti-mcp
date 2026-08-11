// Benchmark: GCF vs JSON on representative OpenCTI tool output.
//
// The record schema below is exactly what the search_indicators / search_malware /
// search_threat_actors tools emit (see src/index.ts, the stixCoreObjects.edges.map
// projection): a 13-field uniform record per result. Token counts use the cl100k
// and o200k tokenizers, compared against the server's current JSON output.
//
// Reproduce:
//   npm install
//   node benchmarks/gcf-benchmark.mjs
import { encode as cl100k } from 'gpt-tokenizer/encoding/cl100k_base';
import { encode as o200k } from 'gpt-tokenizer/encoding/o200k_base';
import { encodeGeneric, decodeGeneric } from '@blackwell-systems/gcf';

const NAMES = ['LockBit', 'Emotet', 'Cobalt Strike', 'AgentTesla', 'QakBot', 'IcedID',
  'RedLine Stealer', 'BlackCat', 'Gootloader', 'PlugX', 'Raccoon', 'Vidar', 'DarkGate'];
const TYPES = ['ransomware', 'trojan', 'backdoor', 'dropper', 'worm', 'spyware'];
const PATTERNS = [
  "[ipv4-addr:value = '198.51.100.42']",
  "[file:hashes.'SHA-256' = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']",
  "[domain-name:value = 'malicious-c2.example.net']",
  "[url:value = 'http://phish.example.com/login']",
];
const iso = d => new Date(1723000000000 - d * 86400000).toISOString();

const makeIndicators = n => Array.from({ length: n }, (_, i) => ({
  id: `indicator--${(0xf4240 + i).toString(16)}-a1b2-4c3d-8e9f-${(i * 7919).toString(16).padStart(12, '0')}`,
  name: `${NAMES[i % NAMES.length]} C2 indicator ${i + 1}`,
  description: 'Observed in incident triage; associated with credential theft and lateral movement.',
  created: iso(30 + i), modified: iso(i), type: TYPES[i % TYPES.length],
  family: i % 3 === 0 ? 'Yes' : 'No', firstSeen: iso(30 + i), lastSeen: iso(i % 5),
  pattern: PATTERNS[i % PATTERNS.length], validFrom: iso(30 + i), validUntil: iso(-30 + i),
  score: 40 + (i * 7) % 60,
}));

const norm = v => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, norm(x)]))
  : Array.isArray(v) ? v.map(norm) : v;
const pct = (base, x) => (((base - x) / base) * 100).toFixed(1) + '%';

console.log('records |    tokenizer | JSON(current) |   GCF | GCF vs JSON | round-trip');
for (const n of [50, 200, 500]) {
  const d = makeIndicators(n);
  const current = JSON.stringify(d, null, 2), gcf = encodeGeneric(d);
  const rt = JSON.stringify(norm(decodeGeneric(gcf))) === JSON.stringify(d) ? 'lossless' : 'MISMATCH';
  for (const [name, enc] of [['cl100k', cl100k], ['o200k', o200k]]) {
    const [c, g] = [current, gcf].map(s => enc(s).length);
    console.log(`${String(n).padStart(7)} | ${name.padStart(12)} | ${String(c).padStart(13)} | ${String(g).padStart(5)} | ${pct(c, g).padStart(11)} | ${rt}`);
  }
}
