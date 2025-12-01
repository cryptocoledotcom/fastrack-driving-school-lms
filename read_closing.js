const fs = require('fs');
const lines = fs.readFileSync('src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
console.log('--- Closing sections ---');
for(let i = 351; i < 365; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
