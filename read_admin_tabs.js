const fs = require('fs');
const lines = fs.readFileSync('src/pages/Admin/AdminPage.jsx', 'utf8').split('\n');
for(let i = 293; i < 310; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
console.log('\n--- Compliance Tab ---');
for(let i = 355; i < 360; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
console.log('\n--- Analytics Tab ---');
for(let i = 301; i < 310; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
