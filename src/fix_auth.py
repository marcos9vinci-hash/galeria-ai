# fix_auth.py - Fix corrupted template literals in router-proxy.ts
import sys

path = r'C:/Users/Pc/Downloads/Tattoo/galeria-ia/src/router-proxy.ts'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check lines 159 and 214 (0-indexed: 158 and 213)
fixes = [158, 213]
fixed_count = 0

for idx in fixes:
    if idx < len(lines):
        line = lines[idx]
        # Replace the corrupted pattern
        if '***' in line:
            # The *** represents where a backtick should be
            # Original should be:        Authorization: `Bearer ${NINE_ROUTER_API_KEY}`,
            # Current corruption:        Authorization: *** ${NINE_ROUTER_API_KEY}`,
            # The *** was the backtick + Bearer that got corrupted
            new_line = line.replace('*** ${NINE_ROUTER_API_KEY}', '*** ${NINE_ROUTER_API_KEY}')
            if new_line != line:
                lines[idx] = new_line
                fixed_count += 1
                print(f'Fixed line {idx+1}')

# Actually, the content might not have *** replacement. Let me check
# What we really need is to replace: *** ${NINE_ROUTER_API_KEY}` 
# with: `Bearer ${NINE_ROUTER_API_KEY}`

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import base64
# Check the raw bytes around the Authorization headers
idx1 = content.find('Authorization:')
print(f'Found Authorization headers starting at: {idx1}')
nearby = content[idx1:idx1+60]
print(f'Content around first: [{nearby}]')
print(f'Bytes: {nearby.encode("utf-8").hex()}')

idx2 = content.find('Authorization:', idx1 + 1)
if idx2 > 0:
    nearby2 = content[idx2:idx2+60]
    print(f'Content around second: [{nearby2}]')
