const fs = require('fs');

const content = fs.readFileSync('src/api/enrollmentServices.js', 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}\n`);

const functions = [];
const funcRegex = /export const (\w+) = /g;
let match;
while ((match = funcRegex.exec(content)) !== null) {
  functions.push(match[1]);
}

console.log(`Total functions: ${functions.length}`);
console.log('Functions:');
functions.forEach(f => console.log(`  - ${f}`));

console.log('\n=== FULL FILE ===\n');
lines.forEach((line, i) => {
  console.log(String(i + 1).padStart(3) + ': ' + line);
});
