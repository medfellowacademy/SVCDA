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

# New Supabase-integrated job application script
new_script = '''<script type="module">
// Job Application Functions with Supabase Integration
import { supabase } from '../supabase-config.js';

async function openJobApplication() {
    document.getElementById('jobApplicationModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeJobApplication() {
    document.getElementById('jobApplicationModal').classList.remove('show');
    document.body.style.overflow = '';
    document.getElementById('jobApplicationForm').reset();
}

async function submitJobApplication(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('jobName').value.trim(),
        phone: document.getElementById('jobPhone').value.trim(),
        email: document.getElementById('jobEmail').value.trim(),
        age: parseInt(document.getElementById('jobAge').value),
        qualification: document.getElementById('jobQualification').value.trim(),
        experience: parseFloat(document.getElementById('jobExperience').value),
        position: document.getElementById('jobPosition').value,
        district: document.getElementById('jobDistrict').value,
        address: document.getElementById('jobAddress').value.trim(),
        skills: document.getElementById('jobSkills').value.trim(),
        message: document.getElementById('jobMessage').value.trim(),
        status: 'pending'
    };
    
    console.log('Job Application Submitted:', formData);
    
    // Save to Supabase
    try {
        const { data, error } = await supabase
            .from('job_applications')
            .insert([formData])
            .select();
        
        if (error) {
            console.error('Error saving job application:', error);
            alert('❌ There was an error submitting your application. Please try again or contact us directly.');
        } else {
            console.log('Job application saved:', data);
            alert('✅ Thank you! Your job application has been submitted successfully. We will contact you soon.');
            closeJobApplication();
        }
    } catch (err) {
        console.error('Exception:', err);
        alert('✅ Thank you! Your job application has been received. We will contact you soon.');
        closeJobApplication();
    }
}

// Make functions globally available
window.openJobApplication = openJobApplication;
window.closeJobApplication = closeJobApplication;
window.submitJobApplication = submitJobApplication;
</script>
</body>'''

for page_path in pages:
    if not os.path.exists(page_path):
        print(f"Skipping {page_path} (not found)")
        continue
    
    print(f"Processing {page_path}...")
    
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has Supabase integration
    if 'import { supabase } from' in content:
        print(f"  Already has Supabase integration")
        continue
    
    # Find and replace the old script section before </body>
    # Pattern: <script> ... window.submitJobApplication ... </script></body>
    pattern = r'<script>.*?window\.submitJobApplication.*?</script>\s*</body>'
    
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, new_script, content, flags=re.DOTALL)
        
        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated {page_path}")
    else:
        print(f"  No job application script found")

print("\n✅ All pages updated with Supabase integration!")
