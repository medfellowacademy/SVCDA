#!/bin/bash

# List of HTML files to update (excluding index.html, employee-login.html, member-login.html, employee-dashboard.html, member-dashboard.html)
pages=(
    "pages/about.html"
    "pages/agriculture.html"
    "pages/business.html"
    "pages/contact.html"
    "pages/education.html"
    "pages/employment.html"
    "pages/health.html"
    "pages/sectors.html"
    "pages/services.html"
    "pages/vision.html"
    "pages/women-empowerment.html"
    "pages/grocery.html"
    "pages/skill-development.html"
    "pages/premium-card.html"
    "pages/order-service.html"
    "pages/order-service-old.html"
    "pages/register.html"
    "pages/payment-success.html"
)

# Product pages with different icon style
product_pages=(
    "pages/ayurvedic-products.html"
    "pages/health-products.html"
    "pages/grocery-products.html"
    "pages/education-products.html"
    "pages/electronics.html"
)

echo "Updating navigation buttons in pages..."

for page in "${pages[@]}"; do
    if [ -f "$page" ]; then
        echo "Processing $page"
        # Add Job Application button with SVG icons (standard pages)
        sed -i '' 's|<a href="employee-login.html" class="ncta" style="background:var(--n);"><svg|<a href="employee-login.html" class="ncta" style="background:var(--n);"><svg|g' "$page"
    fi
done

echo "Pages updated successfully!"
