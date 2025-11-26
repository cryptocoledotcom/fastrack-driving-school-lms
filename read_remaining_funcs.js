const fs = require('fs');
const content = fs.readFileSync('src/api/enrollmentServices.js', 'utf8');
const lines = content.split('\n');

console.log('Lines 426-827 (remaining functions):');
for (let i = 425; i < Math.min(827, lines.length); i++) {
  console.log(String(i + 1).padStart(3) + ': ' + lines[i]);
}
