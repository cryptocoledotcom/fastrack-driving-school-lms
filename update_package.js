const fs = require('fs');
const path = './package.json';

try {
  const pkg = JSON.parse(fs.readFileSync(path, 'utf-8'));
  
  if (!pkg.dependencies) pkg.dependencies = {};
  
  pkg.dependencies['recharts'] = '^2.10.3';
  
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log('✅ Added recharts to package.json');
} catch (err) {
  console.error('❌ Error:', err.message);
}
