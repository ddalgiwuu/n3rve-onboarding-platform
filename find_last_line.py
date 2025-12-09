
with open('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 'r') as f:
    lines = f.readlines()

for i in range(3065, 2346, -1):
    line = lines[i].strip()
    if not line.startswith('//') and line:
        print(f"Last non-comment line is at {i+1}: {line}")
        # Print context
        for j in range(max(0, i-5), min(len(lines), i+6)):
             print(f"{j+1}: {lines[j].rstrip()}")
        break
