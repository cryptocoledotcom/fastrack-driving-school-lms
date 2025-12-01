const fs = require('fs');
const lines = fs.readFileSync('functions/index.js', 'utf8').split('\n');

console.log('Lines 610-650:');
for (let i = 610; i < 650; i++) {
  console.log(`${i}: ${lines[i]}`);
}

console.log('\n\nLines 850-882:');
for (let i = 850; i < Math.min(882, lines.length); i++) {
  console.log(`${i}: ${lines[i]}`);
}
