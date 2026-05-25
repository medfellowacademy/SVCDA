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

header_css = '''  <style>
    /* Enhanced Header Styles */
    header.sc {
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06) !important;
    }
    
    .h-ctas {
      display: flex !important;
      gap: 10px !important;
      align-items: center !important;
    }
    
    /* Enhanced CTA Button Styles */
    .ncta {
      display: inline-flex !important;
      align-items: center !important;
      gap: 7px !important;
      padding: 10px 20px !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      border-radius: 12px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
      text-decoration: none !important;
      border: none !important;
      cursor: pointer !important;
      font-family: inherit !important;
    }
    
    /* Employee Button - Navy */
    .ncta[href*="employee-login"] {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
      color: #fff !important;
    }
    
    .ncta[href*="employee-login"]:hover {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(30, 58, 138, 0.35) !important;
    }
    
    /* Job Application Button - Orange */
    .ncta[onclick*="openJobApplication"] {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
      color: #fff !important;
    }
    
    .ncta[onclick*="openJobApplication"]:hover {
      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4) !important;
    }
    
    /* Call Now Button - Teal */
    .ncta[href*="tel:"] {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
      color: #fff !important;
    }
    
    .ncta[href*="tel:"]:hover {
      background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4) !important;
    }
    
    .ncta svg {
      flex-shrink: 0;
    }
    
    /* Logo Enhancement */
    .logo {
      display: flex !important;
      align-items: center !important;
      transition: transform 0.3s ease !important;
    }
    
    .logo:hover {
      transform: scale(1.02) !important;
    }
    
    .ln {
      font-weight: 800 !important;
      font-size: 1.25rem !important;
      letter-spacing: -0.02em !important;
    }
    
    .lt2 {
      font-size: 0.7rem !important;
      font-weight: 500 !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
      margin-top: -2px !important;
    }
    
    /* Navigation Enhancement */
    .ni > a {
      font-weight: 500 !important;
      font-size: 0.95rem !important;
      transition: all 0.2s ease !important;
    }
    
    header.sc .ni > a:hover {
      color: var(--a) !important;
      background: rgba(249, 115, 22, 0.08) !important;
    }
'''

for page_path in pages:
    if not os.path.exists(page_path):
        print(f"Skipping {page_path} (not found)")
        continue
    
    print(f"Processing {page_path}...")
    
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if enhanced header CSS already exists
    if '/* Enhanced Header Styles */' in content:
        print(f"  Already has enhanced styles, skipping...")
        continue
    
    # Find the existing style block and replace/enhance it
    # Pattern: find <style> ... .job-app-modal ... </style>
    style_pattern = r'(<style>)(.*?)(\.job-app-modal.*?</style>)'
    
    if re.search(style_pattern, content, re.DOTALL):
        # Replace the style block with enhanced version
        replacement = r'\1' + header_css + r'\n    \3'
        content = re.sub(style_pattern, replacement, content, flags=re.DOTALL)
        
        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Enhanced {page_path}")
    else:
        print(f"  No style block found, skipping...")

print("\n✅ All pages enhanced!")
