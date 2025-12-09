
import re

with open('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 'r') as f:
    lines = f.readlines()

start_line = 1519
end_line = 2345

stack = []

for i in range(start_line, end_line):
    line = lines[i]
    # Remove comments
    line_no_comment = re.sub(r'//.*', '', line)
    
    # Find all div tags
    matches = re.finditer(r'<(/?)div\b', line_no_comment)
    
    for match in matches:
        is_closing = match.group(1) == '/'
        
        if is_closing:
            if stack:
                stack.pop()
        else:
            stack.append(i+1)

print("Unclosed divs opened at lines:")
for line_num in stack:
    print(f"Line {line_num}: {lines[line_num-1].strip()}")
