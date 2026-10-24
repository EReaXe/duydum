#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const names = ['AGENTS.md', 'CLAUDE.md'];
const read = name => fs.readFileSync(path.join(root, name));
const equal = (a, b) => a.equals(b);
function sync(name) {
  if (!names.includes(name)) throw Error('Kaynak AGENTS.md veya CLAUDE.md olmalı.');
  const target = names.find(item => item !== name);
  const content = read(name);
  fs.writeFileSync(path.join(root, target), content);
  console.log(`${name} → ${target}`);
}
try {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--from') sync(args[1]);
  else if (args.length === 1 && args[0] === '--check') {
    if (!equal(read(names[0]), read(names[1]))) throw Error('Talimat dosyaları farklı; doğru kaynağı seçip --from ile eşitle.');
    console.log('OK: AGENTS.md ve CLAUDE.md birebir aynı.');
  } else if (args.length === 1 && args[0] === '--watch') {
    let previous = names.map(read);
    if (!equal(...previous)) throw Error('İzleme öncesi farklı dosyaları --from ile eşitle.');
    console.log('Talimat dosyaları izleniyor. Durdurmak için Ctrl+C.');
    const timer = setInterval(() => {
      try {
        const current = names.map(read);
        const changed = current.map((bytes, i) => !equal(bytes, previous[i]));
        if (!changed.some(Boolean)) return;
        if (!equal(...current)) {
          if (changed.every(Boolean)) throw Error('İki dosya da farklı içerikle değişti. Otomatik üzerine yazılmadı; --from ile karar ver.');
          const index = changed.findIndex(Boolean);
          sync(names[index]);
        }
        previous = names.map(read);
      } catch (error) {
        clearInterval(timer);
        console.error(error.message);
        process.exitCode = 1;
      }
    }, 500);
  } else throw Error('Kullanım: node scripts/sync-instructions.cjs --check | --from AGENTS.md | --from CLAUDE.md | --watch');
} catch (error) { console.error(error.message); process.exitCode = 1; }
