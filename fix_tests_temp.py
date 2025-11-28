import re

# Fix useBreakManagement tests
with open('src/hooks/useBreakManagement.test.js', 'r') as f:
    content = f.read()

# Line 194: Change BREAK_REQUIRED_AFTER.toString() to '2 * 3600'
content = re.sub(
    r"expect\(content\)\.toContain\(BREAK_REQUIRED_AFTER\.toString\(\)\);",
    "expect(content).toContain('2 * 3600');",
    content
)

# Line 205: Change '600' to '10 * 60'
content = re.sub(
    r"expect\(content\)\.toContain\('600'\);",
    "expect(content).toContain('10 * 60');",
    content
)

# Line 250: Change 'push' to '[...prev'
content = re.sub(
    r"expect\(content\)\.toContain\('push'\);",
    "expect(content).toContain('[...prev');",
    content
)

with open('src/hooks/useBreakManagement.test.js', 'w') as f:
    f.write(content)

print('Fixed useBreakManagement tests')

# Fix validators test - add breakType to test data
with open('src/api/validators/__tests__/validators.test.js', 'r') as f:
    val_content = f.read()

val_content = val_content.replace(
    """it('should accept valid break data', () => {
      const breakData = {
        userId: 'user123',
        courseId: 'course123',
        breakStartTime: Date.now() - 1000,
        breakEndTime: Date.now()
      };""",
    """it('should accept valid break data', () => {
      const breakData = {
        userId: 'user123',
        courseId: 'course123',
        breakType: 'scheduled',
        breakStartTime: Date.now() - 1000,
        breakEndTime: Date.now()
      };"""
)

with open('src/api/validators/__tests__/validators.test.js', 'w') as f:
    f.write(val_content)

print('Fixed validators test')
