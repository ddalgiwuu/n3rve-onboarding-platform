
with open('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 'r') as f:
    lines = f.readlines()

# Lines 2456 to 3065 (0-indexed)
start_line = 2456
end_line = 3065

for i in range(start_line, end_line):
    line = lines[i].strip()
    if not line:
        continue
    if not line.startswith('//'):
        print(f"Found stray code at line {i+1}: {line}")
