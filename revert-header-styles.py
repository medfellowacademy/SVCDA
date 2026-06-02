#!/usr/bin/env python3
import os
import re

files_to_update = [
    "index.html",
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

# Simple CSS without enhanced header styles
simple_css = '''  <style>
    /* Job Application Modal */
    .job-app-modal { position: fixed; inset: 0; background: rgba(2, 8, 23, 0.62); display: none; align-items: center; justify-content: center; z-index: 1200; padding: 16px; }
    .job-app-modal.show { display: flex; }
    .job-app-card { width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; background: #fff; border-radius: 16px; border: 1px solid var(--bdr); }
    .job-app-head { padding: 16px 20px; background: var(--a); color: #fff; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
    .job-app-head h3 { margin: 0; font-size: 1.15rem; }
    .job-app-close { border: none; background: transparent; color: #fff; font-size: 1.3rem; cursor: pointer; font-weight: bold; }
    .job-app-body { padding: 20px; }
    .job-app-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .job-app-field label { display: block; margin-bottom: 6px; font-weight: 600; color: var(--n); font-size: .88rem; }
    .job-app-field input, .job-app-field select, .job-app-field textarea { width: 100%; border: 1px solid var(--bdr); border-radius: 10px; padding: 11px 13px; font-size: .9rem; font-family: inherit; }
    .job-app-field textarea { resize: vertical; min-height: 80px; }
    .job-app-actions { margin-top: 18px; display: flex; gap: 12px; justify-content: flex-end; }
    .job-app-actions button { border: none; border-radius: 10px; padding: 12px 20px; font-weight: 700; cursor: pointer; font-size: .9rem; }
    .job-app-cancel { background: #E2E8F0; color: #0F172A; }
    .job-app-submit { background: var(--a); color: #fff; }
    @media(max-width:680px){ .job-app-grid { grid-template-columns: 1fr; } }
  </style>
</head>'''

for file_path in files_to_update:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path} (not found)")
        continue
    
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove enhanced header CSS block and replace with simple version
    # Pattern: find from <style> to </head>
    pattern = r'<style>.*?</style>\s*</head>'
    
    if re.search(pattern, content, re.DOTALL):
        # Replace the entire style block
        content = re.sub(pattern, simple_css, content, flags=re.DOTALL)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Reverted {file_path}")
    else:
        print(f"  No style block found to revert")

print("\n✅ Header styles reverted to original!")
