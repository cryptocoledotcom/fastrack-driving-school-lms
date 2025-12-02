const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
console.log(JSON.stringify(pkg, null, 2));
