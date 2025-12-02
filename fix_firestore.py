#!/usr/bin/env python3
import re

with open('functions/index.js', 'r') as f:
    content = f.read()

# Replace getFirestore().collection with db.collection
content = re.sub(r'getFirestore\(\)\.collection', 'db.collection', content)

with open('functions/index.js', 'w') as f:
    f.write(content)

print("Fixed getFirestore() calls")
