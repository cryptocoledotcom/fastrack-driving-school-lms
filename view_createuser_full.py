with open('functions/index.js', 'r') as f:
    lines = f.readlines()
    in_function = False
    for i in range(len(lines)):
        if 'exports.createUser = onCall' in lines[i]:
            in_function = True
            start = i
        if in_function:
            print(f"{i+1}: {lines[i]}", end='')
            if i > start + 5 and (lines[i].strip() == '});' or (lines[i].strip().startswith('}') and not lines[i].strip().startswith('} catch'))):
                if i > start + 60:
                    break
