const fs = require('fs');
const file = process.argv[2];
const search = process.argv[3];
if (!file || !search) {
  console.log('Usage: node search_file.js <path> <search>');
  process.exit(1);
}
try {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes(search)) {
      console.log(`${i+1}: ${line}`);
    }
  });
} catch (err) {
  console.error('Error:', err.message);
}
