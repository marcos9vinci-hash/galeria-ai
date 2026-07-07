#!/usr/bin/env python3
import os
import re

SUPABASE_URL = "https://wrybqqitsylqyhgzodyc.supabase.co/functions/v1"

# Files to process
src_dir = "src"

# Pattern: fetch("/api/...") or axios.post("/api/...") etc.
# Replace with full URL
patterns = [
    # fetch("/api/xxx") -> fetch("https://.../functions/v1/xxx")
    (r'fetch\(["\'](/api/([^"\']+))["\']', lambda m: f'fetch("{SUPABASE_URL}/{m.group(2)}"'),
    # axios.post("/api/xxx") -> axios.post("https://.../functions/v1/xxx")
    (r'(axios\.(?:post|get|put|delete)\(["\'])(/api/[^"\']+)(["\'])', lambda m: f'{m.group(1)}{SUPABASE_URL}/{m.group(2).split("/api/")[1]}{m.group(3)}'),
    # Other patterns like `/api/buffer/posts/${p.id}` - dynamic, handle separately
]

# Additional dynamic patterns
# /api/buffer/posts/${p.id} -> full URL with template
# /api/instagram/insights?igId=... -> full URL

files_changed = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            # Handle dynamic paths with template literals
            # /api/buffer/posts/${p.id} -> ${SUPABASE_URL}/buffer/posts/${p.id}
            content = re.sub(
                r'["\'](/api/([^"\']+))["\']',
                lambda m: f'"{SUPABASE_URL}/{m.group(2)}"' if '${' not in m.group(1) else m.group(0).replace('/api/', f'{SUPABASE_URL}/'),
                content
            )
            
            # Handle template literals: `/api/xxx/${var}`
            content = re.sub(
                r'`(/api/([^`$]+)(?:\$\{[^}]+\})*)`',
                lambda m: f'`{SUPABASE_URL}/{m.group(2)}{m.group(1).split("/api/")[1].split(m.group(2))[1] if m.group(2) in m.group(1) else ""}`',
                content
            )
            
            # Simpler: just replace all /api/ with full URL
            # But only for string literals, not inside comments
            # Use a more careful approach
            
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                files_changed += 1
                print(f"Changed: {path}")

print(f"Total files changed: {files_changed}")
