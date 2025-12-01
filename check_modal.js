const fs = require('fs');
const content = fs.readFileSync('src/components/auth/ForcePasswordChangeModal.jsx', 'utf8');
const lines = content.split('\n');
lines.slice(0, 20).forEach((line, i) => {
  console.log(`${i+1}: ${line}`);
});
