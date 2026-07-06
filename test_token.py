import requests
token = "nfp_BUjCZX7ZMHjt2f9hQ2DoHpYXVq5rHCtv122c"
r = requests.get("https://api.netlify.com/api/v1/user", headers={"Authorization": f"Bearer {token}"})
print(r.status_code)
print(r.text)