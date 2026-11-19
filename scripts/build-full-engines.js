const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to write files and maintain strict 3-5% comment density
function writeFileWithDensity(filePath, codeLines, commentLines) {
  const fullPath = path.join(ROOT_DIR, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  const totalLines = codeLines.length + commentLines.length;
  // Interleave comments naturally to hit target density ~3.5%
  const code = [];
  let commentIdx = 0;
  const interval = Math.max(1, Math.floor(codeLines.length / (commentLines.length || 1)));

  for (let i = 0; i < codeLines.length; i++) {
    if (i % interval === 0 && commentIdx < commentLines.length) {
      code.push(commentLines[commentIdx++]);
    }
    code.push(codeLines[i]);
  }

  while (commentIdx < commentLines.length) {
    code.push(commentLines[commentIdx++]);
  }

  fs.writeFileSync(fullPath, code.join('\n') + '\n', 'utf8');
}

console.log('Engine generator script initialized.');
