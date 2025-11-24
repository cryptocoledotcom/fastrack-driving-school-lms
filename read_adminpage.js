const fs = require('fs');
const lines = fs.readFileSync('./src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
console.log('Lines 330-343:');
for (let i = 329; i < 343; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
