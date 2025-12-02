const { execSync } = require('child_process');

try {
  console.log('Installing dependencies...');
  const result = execSync('npm install', {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  console.log('✅ Dependencies installed successfully');
} catch (err) {
  console.error('❌ Installation failed:', err.message);
  process.exit(1);
}
