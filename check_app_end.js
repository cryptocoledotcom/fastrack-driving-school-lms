const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');
console.log(`Total lines: ${lines.length}`);
console.log('Last 50 lines:');
for (let i = Math.max(0, lines.length - 50); i < lines.length; i++) {
  console.log(`${i}: ${lines[i]}`);
}
