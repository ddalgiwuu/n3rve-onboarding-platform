
import re

with open('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 'r') as f:
    lines = f.readlines()

start_line = 1519
end_line = 2345

balance = 0
for i in range(start_line, end_line):
    line = lines[i]
    # Remove comments
    line = re.sub(r'//.*', '', line)
    
    open_divs = len(re.findall(r'<div\b', line))
    close_divs = len(re.findall(r'</div>', line))
    
    balance += open_divs - close_divs
    
    if balance < 0:
        print(f"Negative balance at line {i+1}: {balance}")
    
print(f"Final balance: {balance}")
