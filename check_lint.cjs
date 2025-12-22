/* global require */
const { execSync } = require('child_process');

const output = execSync('npm run lint 2>&1', { encoding: 'utf8' });
const lines = output.split('\n');
const lastLine = lines[lines.length - 2];

console.warn('=== Current ESLint Status ===');
console.warn(lastLine);

// Extract problem count
const match = lastLine.match(/✖ (\d+) problems \((\d+) errors?, (\d+) warnings?\)/);
if (match) {
  console.warn('\nSummary:');
  console.warn(`Total problems: ${match[1]}`);
  console.warn(`  Errors: ${match[2]}`);
  console.warn(`  Warnings: ${match[3]}`);
}
