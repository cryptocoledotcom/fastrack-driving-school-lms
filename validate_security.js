const parser = require('@babel/parser');
const fs = require('fs');

const code = fs.readFileSync('src/api/securityServices.js', 'utf-8');

try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('✓ securityServices.js syntax is valid');
  process.exit(0);
} catch (error) {
  console.error('✗ Syntax error in securityServices.js:');
  console.error(error.message);
  process.exit(1);
}
