const fs = require('fs');
const content = fs.readFileSync('src/api/enrollmentServices.js', 'utf8');
const lines = content.split('\n');

console.log('Lines 314-450:');
for (let i = 313; i < 450; i++) {
  if (i < lines.length) {
    console.log(String(i + 1).padStart(3) + ': ' + lines[i]);
  }
}
