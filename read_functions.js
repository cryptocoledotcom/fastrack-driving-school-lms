const fs = require('fs');
const content = fs.readFileSync('functions/index.js', 'utf8');
console.log(content);
