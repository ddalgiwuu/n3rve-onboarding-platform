
import re

with open('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 'r') as f:
    lines = f.readlines()

# Case 1 is from line 1519 to 2345 (0-indexed: 1519 to 2345)
start_line = 1519
end_line = 2345

stack = []

# Regex for tags
tag_re = re.compile(r'</?(\w+)[^>]*>')

for i in range(start_line, end_line):
    line = lines[i]
    # Find all tags in the line
    for match in tag_re.finditer(line):
        tag = match.group(0)
        tag_name = match.group(1)
        
        if tag.startswith('</'):
            # Closing tag
            if stack and stack[-1][0] == tag_name:
                stack.pop()
            else:
                # print(f"Unexpected closing tag {tag} at line {i+1}")
                pass # Ignore for now, maybe self-closing or void tags messed up
        elif not tag.endswith('/>') and tag_name not in ['img', 'input', 'br', 'hr', 'meta', 'link']:
            # Opening tag (not self-closing and not void)
            stack.append((tag_name, i+1))

print("Unclosed tags:")
for tag, line_num in stack:
    if tag == 'div':
        print(f"Unclosed {tag} at line {line_num}")
        # Print context
        print(f"Context: {lines[line_num-1].strip()}")
