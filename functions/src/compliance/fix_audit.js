const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'auditFunctions.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/userDoc\.exists\(\)/g, 'userDoc.exists');

fs.writeFileSync(filePath, content);
console.log('Fixed userDoc.exists() calls');
