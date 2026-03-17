
import os

file_path = r'c:\Users\Muneeswaran\Documents\Retrostyling\retrostyling\retrostyling\package-lock.json'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace('Retrostylings://', 'https://')
new_content = new_content.replace('retrostylings://', 'https://')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced all occurrences in package-lock.json")
