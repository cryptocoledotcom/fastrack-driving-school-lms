const fs = require('fs');
const lines = fs.readFileSync('functions/index.js', 'utf8').split('\n');

for (let i = 640; i < 880; i++) {
  console.log(`${i}: ${lines[i]}`);
}
