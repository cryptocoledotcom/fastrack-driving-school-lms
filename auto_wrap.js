#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Services and their files
const services = [
  'src/api/enrollmentServices.js',
  'src/api/quizServices.js',
  'src/api/complianceServices.js',
  'src/api/courseServices.js',
  'src/api/paymentServices.js',
  'src/api/lessonServices.js',
  'src/api/schedulingServices.js',
  'src/api/pvqServices.js',
  'src/api/securityServices.js'
];

function wrapFunction(content) {
  // Replace try/catch blocks with executeService wrapper
  // Pattern: "  try {" -> "  return executeService(async () => {"
  // Pattern: "  } catch (error) {" -> "    } catch (error) {"
  // Pattern: "    console.error(...)" -> remove
  // Pattern: "    throw error;" -> "      throw error;"
  // Pattern: "  }" -> "  }, 'functionName');"
  
  let result = content;
  
  // Find all try blocks that aren't already wrapped
  const tryBlockRegex = /(\n\s+)try\s*\{/g;
  result = result.replace(tryBlockRegex, (match, indent) => {
    return `${indent}try {`;
  });
  
  // Remove console.error lines
  result = result.replace(/\s*console\.error\([^)]+\);\s*/g, '');
  
  return result;
}

// For each service file
services.forEach(serviceFile => {
  if (!fs.existsSync(serviceFile)) {
    console.log(`⏭️  ${serviceFile} - NOT FOUND`);
    return;
  }
  
  let content = fs.readFileSync(serviceFile, 'utf8');
  const originalLength = content.split('\n').length;
  
  // Count functions that need wrapping
  const unwrappedFuncs = (content.match(/\n\s+try\s*{/g) || []).length;
  
  if (unwrappedFuncs === 0) {
    console.log(`✅ ${serviceFile} - Already wrapped`);
    return;
  }
  
  console.log(`⏳ ${serviceFile} - Found ${unwrappedFuncs} functions to wrap`);
  
  // This script just reports - actual wrapping done by manual edits
  // due to complexity of nested try/catch blocks
});

console.log('\n📝 Remaining manual wrapping needed');
console.log('Run QUICK_START_WRAPPING.md instructions for remaining functions');
