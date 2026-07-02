import re
path = r"C:/Users/Pc/Downloads/Tattoo/galeria-ia/src/router-proxy.ts"
with open(path, "r") as f:
    content = f.read()

# Replace literal *** in Authorization headers
old = "Authorization: *** "
new = "Authorization: "
count = content.count(old)
content = content.replace(old, new)
with open(path, "w") as f:
    f.write(content)
print(f"Fixed {count} occurences. Replaced *** with Bearer backtick.")
