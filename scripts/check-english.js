const fs = require('fs');
const path = require('path');

const exclude = new Set(['node_modules', '.git', 'dist', 'build', '.vite', '.system_generated']);
const hinglishKeywords = [
  'karo', 'chahiye', 'karna', 'poori', 'cheezon', 'bhai', 'apne', 'hoga',
  'dekhna', 'sabhi', 'aur', 'iske', 'nahi', 'pehle', 'kuch', 'bhi'
];

let matches = 0;

function scan(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (exclude.has(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scan(full);
    } else if (item.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.sql') || full.endsWith('.md'))) {
      if (item.name === 'check-english.js') continue;
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        for (const w of hinglishKeywords) {
          const regex = new RegExp(`\\b${w}\\b`, 'i');
          if (regex.test(lower)) {
            console.log(`[NON-ENGLISH DETECTED] ${full}:${idx + 1}: ${line.trim()}`);
            matches++;
            break;
          }
        }
      });
    }
  }
}

scan('.');
console.log(`Scan complete. Found ${matches} potential non-English occurrences.`);
