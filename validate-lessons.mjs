// validate-lessons.mjs
import fs from 'fs';
import path from 'path';

const dir = 'data/lessons';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const index = JSON.parse(fs.readFileSync('data/lessons-index.json', 'utf8'));
const meta = Object.fromEntries(index.lessons.map(l => [l.id, l]));

const VALID_TYPES = ['mcq', 'fill', 'text', 'order', 'double', 'detect', 'ident', 'fix'];

let failures = 0;
for (const f of files) {
  const id = f.replace('.json', '');
  const errors = [];
  let data;

  // 1. JSON.parse FIRST — catch syntax errors
  try {
    data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  } catch (e) {
    console.log(`❌ ${id}: JSON PARSE ERROR — ${e.message}`);
    failures++;
    continue;
  }

  // 2. Structure
  if (!Array.isArray(data.steps) || data.steps.length !== 7) errors.push(`steps must be 7, got ${data.steps?.length}`);
  const finalStep = data.steps?.find(s => s.isFinal);
  if (!finalStep) errors.push('no isFinal step');

  data.steps?.forEach((s, i) => {
    const expect = s.isFinal ? 12 : 3;
    if (s.items?.length !== expect) errors.push(`${s.id}: expected ${expect} items, got ${s.items?.length}`);

    // 3. Word count (warn on 3, error on 4+)
    // Only typed answers count: order.answer is a whole sentence and mcq.answer is an index.
    const TYPED = ['fill', 'text', 'double', 'ident'];
    s.items?.forEach((it, j) => {
      if (TYPED.includes(it.type)) {
        const answers = [...(it.answers || []), ...(it.answers1 || []), ...(it.answers2 || []), it.correctWord].filter(Boolean);
        for (const a of answers) {
          if (typeof a !== 'string') continue;
          const wc = a.trim().split(/\s+/).filter(Boolean).length;
          if (wc > 3) errors.push(`${s.id}-${j}: answer "${a}" has ${wc} words (>3)`);
        }
      }
      if (!VALID_TYPES.includes(it.type)) errors.push(`${s.id}-${j}: invalid type "${it.type}"`);
      if (!it.tag) errors.push(`${s.id}-${j}: missing tag`);
      if (!it.why || it.why.length < 10) errors.push(`${s.id}-${j}: why too short or missing`);
    });

  });

  // 4. Duplicate detection across the WHOLE file (not just inside one step)
  const sigs = new Map();
  data.steps?.forEach(s => {
    s.items?.forEach((it, j) => {
      const content = it.sentence || it.template || (it.words || []).join(' ') || '';
      const answers = [...(it.answers || []), ...(it.answers1 || []), ...(it.answers2 || []), it.correctWord].filter(Boolean).join('/');
      const sig = [it.type, it.prompt, content, answers, (it.options || []).join('/'), it.answer].join('|');
      const label = `${s.id}-${j}`;
      if (sigs.has(sig)) errors.push(`${label}: DUPLICATE of ${sigs.get(sig)} (${it.prompt})`);
      else sigs.set(sig, label);
    });
  });

  // 5. Index coherence
  const m = meta[data.id];
  if (!m) errors.push('lesson not in index');
  else {
    if (m.itemCount !== data.steps?.reduce((sum, s) => sum + (s.items?.length || 0), 0)) errors.push(`itemCount mismatch: index ${m.itemCount}`);
    const itags = [...new Set(data.steps.flatMap(s => s.items.map(i => i.tag)))].sort();
    const mtags = [...m.tags].sort();
    if (JSON.stringify(itags) !== JSON.stringify(mtags)) errors.push(`tags mismatch: index=[${mtags}] actual=[${itags}]`);
  }

  if (errors.length === 0) console.log(`✅ ${id}`);
  else { console.log(`❌ ${id}:`); errors.forEach(e => console.log(`   - ${e}`)); failures++; }
}

console.log(`\n${failures === 0 ? '✅ ALL PASS' : `❌ ${failures} file(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
