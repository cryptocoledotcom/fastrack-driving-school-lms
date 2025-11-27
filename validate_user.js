const parser = require('@babel/parser');
const fs = require('fs');

const code = fs.readFileSync('src/api/userServices.js', 'utf-8');

try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('✓ userServices.js syntax is valid');
  process.exit(0);
} catch (error) {
  console.error('✗ Syntax error in userServices.js:');
  console.error(error.message);
  process.exit(1);
}
