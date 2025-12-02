with open('functions/index.js', 'r') as f:
    lines = f.readlines()
    in_function = False
    for i in range(len(lines)):
        if 'exports.createUser = onCall' in lines[i]:
            in_function = True
            start = i
        if in_function:
            print(f"{i+1}: {lines[i]}", end='')
            if i > start and lines[i].strip().startswith('});'):
                break
