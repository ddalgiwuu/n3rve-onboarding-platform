#!/usr/bin/env python3
"""
Fix indentation issues in ImprovedReleaseSubmissionWithDnD.tsx
This script fixes the indentation of case statements and JSX content that were incorrectly indented.
"""

import re

def fix_indentation(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Define the line ranges and their fixes
    # Format: (start_line, end_line, old_indent, new_indent)
    fixes = [
        # Fix case 3 (lines 3067-3120)
        (3066, 3120, '                  ', '        '),  # 18 spaces to 8 spaces for return and JSX
        (3066, 3120, '                    ', '            '),  # 20 spaces to 12 spaces
        (3066, 3120, '                      ', '              '),  # 22 spaces to 14 spaces
        (3066, 3120, '                        ', '                '),  # 24 spaces to 16 spaces
        (3066, 3120, '                          ', '                  '),  # 26 spaces to 18 spaces
        
        # Fix case 5 (lines 3122-3257)
        (3121, 3257, '                  ', '        '),  # 18 spaces to 8 spaces
        (3121, 3257, '                    ', '            '),  # 20 spaces to 12 spaces
        (3121, 3257, '                      ', '              '),  # 22 spaces to 14 spaces
        (3121, 3257, '                        ', '                '),  # 24 spaces to 16 spaces
        (3121, 3257, '                          ', '                  '),  # 26 spaces to 18 spaces
        
        # Fix default case (lines 3259-3260)
        (3258, 3260, '                  ', '      '),  # 18 spaces to 6 spaces
        
        # Fix steps array and return (lines 3264-3272)
        (3263, 3272, '                  ', '  '),  # 18 spaces to 2 spaces
        (3263, 3272, '                ', '  '),  # 16 spaces to 2 spaces for some lines
        
        # Fix JSX return content (lines 3273-3476)
        (3272, 3476, '                  ', '    '),  # 18 spaces to 4 spaces
        (3272, 3476, '                    ', '      '),  # 20 spaces to 6 spaces
        (3272, 3476, '                      ', '        '),  # 22 spaces to 8 spaces
        (3272, 3476, '                        ', '          '),  # 24 spaces to 10 spaces
        (3272, 3476, '                          ', '            '),  # 26 spaces to 12 spaces
        (3272, 3476, '                            ', '              '),  # 28 spaces to 14 spaces
        (3272, 3476, '                              ', '                '),  # 30 spaces to 16 spaces
        
        # Fix final return and export (lines 3477-3489)
        (3476, 3489, '                  ', '  '),  # 18 spaces to 2 spaces
    ]
    
    # Apply fixes in order from longest to shortest indent to avoid conflicts
    for start, end, old_indent, new_indent in sorted(fixes, key=lambda x: len(x[2]), reverse=True):
        for i in range(start - 1, min(end, len(lines))):
            if lines[i].startswith(old_indent):
                # Only replace the leading indentation
                lines[i] = new_indent + lines[i][len(old_indent):]
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"Fixed indentation in {file_path}")

if __name__ == '__main__':
    import sys
    file_path = sys.argv[1] if len(sys.argv) > 1 else '/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx'
    fix_indentation(file_path)
