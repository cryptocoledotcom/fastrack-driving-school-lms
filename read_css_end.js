const fs = require('fs');
const content = fs.readFileSync('src/pages/Admin/AdminPage.module.css', 'utf8');
const lines = content.split('\n');
const lastLines = lines.slice(-50);
lastLines.forEach((line, index) => {
  console.log(`${lines.length - 50 + index}: ${line}`);
});
