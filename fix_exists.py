#!/usr/bin/env python3
import re

with open('functions/index.js', 'r') as f:
    content = f.read()

# Fix .exists() to .exists
content = re.sub(r'\.exists\(\)', '.exists', content)

with open('functions/index.js', 'w') as f:
    f.write(content)

print('Fixed .exists() calls - changed to .exists property')
