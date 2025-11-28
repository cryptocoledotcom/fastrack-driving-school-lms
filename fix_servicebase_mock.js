const fs = require('fs');

let content = fs.readFileSync('src/api/base/__tests__/ServiceBase.test.js', 'utf8');

// Add collection to the firebase mock
content = content.replace(
  "  writeBatch: jest.fn(),\n  doc: jest.fn(),",
  "  collection: jest.fn(),\n  writeBatch: jest.fn(),\n  doc: jest.fn(),"
);

fs.writeFileSync('src/api/base/__tests__/ServiceBase.test.js', content);
console.log('Fixed ServiceBase mock - added collection function');
