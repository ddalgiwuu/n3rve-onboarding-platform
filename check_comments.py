
with open('/Users/ryansong/Desktop/n3rve-onbaording/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx', 'r') as f:
    lines = f.readlines()

has_code = False
for i in range(2456, 3065): # 0-indexed: line 2457 to 3066
    line = lines[i].strip()
    if line and not line.startswith('//'):
        print(f"Found non-comment line at {i+1}: {line}")
        has_code = True

if not has_code:
    print("All lines between 2457 and 3066 are comments or empty.")
