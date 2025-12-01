const fs = require('fs');
const lines = fs.readFileSync('src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
console.log('--- Enrollment Tab Close ---');
for(let i = 286; i < 295; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
