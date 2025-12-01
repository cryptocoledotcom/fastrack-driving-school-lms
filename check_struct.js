const fs = require('fs');
const lines = fs.readFileSync('src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
console.log('--- Enrollment closing structure ---');
for(let i = 288; i < 297; i++) {
  const line = lines[i];
  console.log(`${i+1}: '${line}'`);
}
