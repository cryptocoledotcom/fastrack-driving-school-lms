const fs = require('fs');
const file = process.argv[2];
if (!file) {
  console.log('Usage: node read_all.js <path>');
  process.exit(1);
}
try {
  const content = fs.readFileSync(file, 'utf-8');
  console.log(content);
} catch (err) {
  console.error('Error:', err.message);
}
