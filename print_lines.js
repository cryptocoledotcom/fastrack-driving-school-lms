const fs = require('fs');
const lines = fs.readFileSync('src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
for(let i = Math.max(0, lines.length - 25); i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
