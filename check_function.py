with open('functions/index.js', 'r') as f:
    lines = f.readlines()
    for i in range(89, 105):
        print(f"{i+1}: {lines[i]}", end='')
    print("\n--- createCheckoutSession signature ---\n")
    for i in range(89, 105):
        if 'data' in lines[i] or 'context' in lines[i] or '=>' in lines[i]:
            print(f"{i+1}: {lines[i]}", end='')
