
import re

def find_unclosed_tags(file_path, start_line, end_line):
    with open(file_path, 'r') as f:
        lines = f.readlines()

    stack = []
    # Regex for tags, ignoring attributes
    tag_re = re.compile(r'</?(\w+)')
    
    for i in range(start_line, end_line):
        line = lines[i]
        
        # Remove single line comments
        line = re.sub(r'//.*', '', line)
        
        # Find all tags
        matches = re.finditer(r'<(/?)(\w+)', line)
        
        for match in matches:
            is_closing = match.group(1) == '/'
            tag_name = match.group(2)
            
            # Find the end of the tag
            start_pos = match.start()
            end_pos = line.find('>', start_pos)
            if end_pos == -1:
                continue 
            
            full_tag = line[start_pos:end_pos+1]
            
            if full_tag.endswith('/>'):
                continue 
            
            if tag_name in ['img', 'input', 'br', 'hr', 'meta', 'link']:
                continue 
            
            if is_closing:
                if stack and stack[-1][0] == tag_name:
                    stack.pop()
                else:
                    pass
            else:
                stack.append((tag_name, i+1))

    print("Unclosed tags:")
    for tag, line_num in stack:
        if tag == 'div':
            print(f"Unclosed {tag} at line {line_num}")
            print(f"Context: {lines[line_num-1].strip()}")

find_unclosed_tags('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 2346, 2455)
