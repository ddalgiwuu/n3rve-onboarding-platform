
with open('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 'r') as f:
    lines = f.readlines()

content = "".join(lines[2346:2455]) # Lines 2347 to 2455 (0-indexed)

open_braces = content.count('{')
close_braces = content.count('}')
open_parens = content.count('(')
close_parens = content.count(')')
open_divs = content.count('<div')
close_divs = content.count('</div>')

print(f"Open braces: {open_braces}, Close braces: {close_braces}")
print(f"Open parens: {open_parens}, Close parens: {close_parens}")
print(f"Open divs: {open_divs}, Close divs: {close_divs}")

if open_braces != close_braces:
    print("Brace mismatch!")
if open_parens != close_parens:
    print("Paren mismatch!")
if open_divs != close_divs:
    print("Div mismatch!")
