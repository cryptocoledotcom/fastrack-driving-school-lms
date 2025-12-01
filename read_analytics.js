const fs = require('fs');
const lines = fs.readFileSync('src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
console.log('--- Analytics Section ---');
for(let i = 303; i < 360; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
