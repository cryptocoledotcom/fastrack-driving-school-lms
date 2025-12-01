const fs = require('fs');
const lines = fs.readFileSync('src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
console.log('--- Enrollment Tab Section ---');
for(let i = 188; i < 205; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
