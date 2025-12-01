const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');
console.log(lines.slice(0, 150).join('\n'));
