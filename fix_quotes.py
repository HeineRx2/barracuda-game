with open("web_preview/src/store.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("\\'", "'")
content = content.replace('\\"', '"')

with open("web_preview/src/store.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Quotes fixed.")
