const fs = require('fs');
const lines = fs.readFileSync('functions/index.js', 'utf8').split('\n');

// Find where generateComplianceReport ends
let inGenerateComplianceReport = false;
let braceCount = 0;

for (let i = 646; i < lines.length; i++) {
  if (!inGenerateComplianceReport && lines[i].includes('exports.generateComplianceReport')) {
    inGenerateComplianceReport = true;
  }
  
  if (inGenerateComplianceReport) {
    braceCount += (lines[i].match(/\{/g) || []).length;
    braceCount -= (lines[i].match(/\}/g) || []).length;
    
    console.log(`${i}: [braces: ${braceCount}] ${lines[i]}`);
    
    if (braceCount === 0 && lines[i].includes('}')) {
      console.log('\n\nFound end of generateComplianceReport at line ' + i);
      break;
    }
  }
}
