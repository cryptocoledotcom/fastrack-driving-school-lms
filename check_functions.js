const fs = require('fs');
const content = fs.readFileSync('functions/index.js', 'utf8');
const lines = content.split('\n');
console.log(`Total lines: ${lines.length}`);
console.log('First 20 lines:');
console.log(lines.slice(0, 20).join('\n'));
console.log('\n---\nLast 20 lines:');
console.log(lines.slice(-20).join('\n'));
