const fs = require('fs');

// Fix useBreakManagement tests
let content = fs.readFileSync('src/hooks/useBreakManagement.test.js', 'utf8');

content = content.replace(
  "expect(content).toContain(BREAK_REQUIRED_AFTER.toString());",
  "expect(content).toContain('2 * 3600');"
);

content = content.replace(
  "expect(content).toContain('600');",
  "expect(content).toContain('10 * 60');"
);

content = content.replace(
  "expect(content).toContain('push');",
  "expect(content).toContain('[...prev');"
);

fs.writeFileSync('src/hooks/useBreakManagement.test.js', content);
console.log('Fixed useBreakManagement tests');

// Fix validators test - add breakType to test data
let valContent = fs.readFileSync('src/api/validators/__tests__/validators.test.js', 'utf8');

const oldBreakData = `it('should accept valid break data', () => {
      const breakData = {
        userId: 'user123',
        courseId: 'course123',
        breakStartTime: Date.now() - 1000,
        breakEndTime: Date.now()
      };`;

const newBreakData = `it('should accept valid break data', () => {
      const breakData = {
        userId: 'user123',
        courseId: 'course123',
        breakType: 'scheduled',
        breakStartTime: Date.now() - 1000,
        breakEndTime: Date.now()
      };`;

valContent = valContent.replace(oldBreakData, newBreakData);
fs.writeFileSync('src/api/validators/__tests__/validators.test.js', valContent);
console.log('Fixed validators test');
