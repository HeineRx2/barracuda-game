import re
with open('style.css', 'rb') as f:
    data = f.read()
    
# Find the end of valid CSS
match = re.search(b'\\.crew-member-card:hover \\{[^\\}]+\\}', data)
if match:
    valid_data = data[:match.end()] + b'\n'
    with open('style.css', 'wb') as f:
        f.write(valid_data)
else:
    print("Could not find the end of the file")
