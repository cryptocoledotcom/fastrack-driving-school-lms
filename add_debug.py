file_path = r'c:\Users\Cole\Documents\Fastrack\Fastrack-Learning_Management-System\functions\src\compliance\auditFunctions.js'

with open(file_path, 'r') as f:
    lines = f.readlines()

debug_line = '// Force deploy: Admin import added\n'
if debug_line not in ''.join(lines):
    lines.insert(6, debug_line)
    
    with open(file_path, 'w') as f:
        f.writelines(lines)
    
    print('Debug log added')
else:
    print('Debug log already present')
