import subprocess

try:
    output = subprocess.check_output('npm test 2>&1', shell=True, text=True, timeout=60)
except subprocess.TimeoutExpired:
    print('Tests timed out')
    exit(1)
except subprocess.CalledProcessError as e:
    output = e.output

lines = output.split('\n')
# Look for test summary
for i, line in enumerate(lines):
    if 'Test Files' in line or 'Tests:' in line or 'passed' in line.lower():
        print(line)
