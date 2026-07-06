import os, json, requests, time

PAT = "sbp_ce123ff934f91824060169e3111a8bf5e651f0d2"
PROJECT_REF = "wrybqqitsylqyhgzodyc"
BASE = f"https://api.supabase.com/v1/projects/{PROJECT_REF}"
HEADERS = {"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"}

funcs_dir = "/c/Users/Pc/Downloads/Tattoo/galeria-ia/supabase/functions"
functions = [d for d in os.listdir(funcs_dir) if os.path.isdir(os.path.join(funcs_dir, d))]

for fn in functions:
    index_path = os.path.join(funcs_dir, fn, "index.ts")
    if not os.path.exists(index_path):
        print(f"SKIP {fn}: no index.ts")
        continue
    
    with open(index_path, 'r') as f:
        body = f.read()
    
    payload = {
        "name": fn,
        "body": body,
        "verify_jwt": False
    }
    
    r = requests.post(f"{BASE}/functions", headers=HEADERS, json=payload)
    if r.status_code in (200, 201):
        print(f"✅ Deployed: {fn}")
    elif r.status_code == 409:
        r = requests.patch(f"{BASE}/functions/{fn}", headers=HEADERS, json=payload)
        print(f"🔄 Updated: {fn} - {r.status_code}")
    else:
        print(f"❌ {fn}: {r.status_code} - {r.text[:200]}")
    
    time.sleep(0.5)

print("Done!")
