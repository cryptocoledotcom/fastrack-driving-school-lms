#!/usr/bin/env python3
import re

with open('functions/index.js', 'r') as f:
    content = f.read()

# Replace the function signature
content = re.sub(
    r'exports\.createUser = onCall\(async \(data, context\) => \{',
    'exports.createUser = onCall(async (request) => {',
    content
)

# Replace context.auth with request.auth
content = re.sub(
    r'if \(!context\.auth\)',
    'if (!request.auth)',
    content
)

# Replace data destructuring with request.data
content = re.sub(
    r'const \{ email, temporaryPassword, displayName, role \} = data;',
    'const { email, temporaryPassword, displayName, role } = request.data;',
    content
)

# Replace performedByAdminId assignment
content = re.sub(
    r'const performedByAdminId = context\.auth\.uid;',
    'const performedByAdminId = request.auth.uid;',
    content
)

with open('functions/index.js', 'w') as f:
    f.write(content)

print('Fixed createUser function signature for Firebase Functions v2')
