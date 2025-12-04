import os

file_path = r'c:\Users\Cole\Documents\Fastrack\Fastrack-Learning_Management-System\functions\src\compliance\auditFunctions.js'

with open(file_path, 'r') as f:
    content = f.read()

if 'const admin = require' not in content:
    content = "const admin = require('firebase-admin');\n" + content
    with open(file_path, 'w') as f:
        f.write(content)
    print('Admin import added')
else:
    print('Admin import already present')
