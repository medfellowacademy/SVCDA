#!/usr/bin/env python3
import os
import re

pages = [
    "pages/about.html",
    "pages/agriculture.html",
    "pages/business.html",
    "pages/contact.html",
    "pages/education.html",
    "pages/employment.html",
    "pages/health.html",
    "pages/sectors.html",
    "pages/services.html",
    "pages/vision.html",
    "pages/women-empowerment.html",
    "pages/grocery.html",
    "pages/skill-development.html",
    "pages/premium-card.html",
    "pages/order-service.html",
    "pages/order-service-old.html",
    "pages/register.html",
]

for page_path in pages:
    if not os.path.exists(page_path):
        continue
    
    print(f"Checking {page_path}...")
    
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix duplicate <style> tags
    if '<style>  <style>' in content:
        print(f"  Fixing duplicate style tags...")
        content = content.replace('<style>  <style>', '<style>')
        
        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed {page_path}")
    else:
        print(f"  No duplicates found")

print("\n✅ Cleanup complete!")
