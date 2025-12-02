const fs = require('fs');
const file = process.argv[2];
const lines = parseInt(process.argv[3]) || 50;
if (!file) {
  console.log('Usage: node read_file.js <path> [lines]');
  process.exit(1);
}
try {
  const content = fs.readFileSync(file, 'utf-8');
  const fileLines = content.split('\n').slice(0, lines);
  console.log(fileLines.join('\n'));
} catch (err) {
  console.error('Error:', err.message);
}
