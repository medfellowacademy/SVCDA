#!/usr/bin/env python3
import os
import re

# List of pages to update
pages = [
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

# CSS to add
css_block = '''  <style>
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

# Button HTML
button_html = '<button onclick="openJobApplication()" class="ncta" style="background:var(--a);border:none;cursor:pointer;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Job Application</button>'

# Modal HTML (to add before </body>)
modal_html = '''
<!-- Job Application Modal -->
<div class="job-app-modal" id="jobApplicationModal" onclick="if(event.target===this){closeJobApplication();}">
    <div class="job-app-card">
        <div class="job-app-head">
            <h3>Job Application Form</h3>
            <button type="button" class="job-app-close" onclick="closeJobApplication()">×</button>
        </div>
        <div class="job-app-body">
            <form id="jobApplicationForm" onsubmit="submitJobApplication(event)">
                <div class="job-app-grid">
                    <div class="job-app-field">
                        <label for="jobName">Full Name *</label>
                        <input type="text" id="jobName" required placeholder="Your full name">
                    </div>
                    <div class="job-app-field">
                        <label for="jobPhone">Phone Number *</label>
                        <input type="tel" id="jobPhone" required placeholder="+91 XXXXXXXXXX" pattern="[+]?[0-9]{10,13}">
                    </div>
                    <div class="job-app-field">
                        <label for="jobEmail">Email *</label>
                        <input type="email" id="jobEmail" required placeholder="you@example.com">
                    </div>
                    <div class="job-app-field">
                        <label for="jobAge">Age *</label>
                        <input type="number" id="jobAge" required placeholder="Your age" min="18" max="65">
                    </div>
                    <div class="job-app-field">
                        <label for="jobQualification">Qualification *</label>
                        <input type="text" id="jobQualification" required placeholder="e.g., B.Tech, MBA">
                    </div>
                    <div class="job-app-field">
                        <label for="jobExperience">Experience (Years) *</label>
                        <input type="number" id="jobExperience" required placeholder="Years of experience" min="0" max="50" step="0.5">
                    </div>
                    <div class="job-app-field">
                        <label for="jobPosition">Position Applied For *</label>
                        <select id="jobPosition" required>
                            <option value="">Select position</option>
                            <option value="field-officer">Field Officer</option>
                            <option value="sales-executive">Sales Executive</option>
                            <option value="digital-marketing">Digital Marketing</option>
                            <option value="customer-support">Customer Support</option>
                            <option value="operations">Operations Manager</option>
                            <option value="accountant">Accountant</option>
                            <option value="hr-executive">HR Executive</option>
                            <option value="business-development">Business Development</option>
                            <option value="others">Others</option>
                        </select>
                    </div>
                    <div class="job-app-field">
                        <label for="jobDistrict">District *</label>
                        <select id="jobDistrict" required>
                            <option value="">Select district</option>
                            <option>Adilabad</option>
                            <option>Bhadradri Kothagudem</option>
                            <option>Hanumakonda</option>
                            <option>Hyderabad</option>
                            <option>Jagtial</option>
                            <option>Jangoan</option>
                            <option>Jayashankar Bhoopalpally</option>
                            <option>Jogulamba Gadwal</option>
                            <option>Kamareddy</option>
                            <option>Karimnagar</option>
                            <option>Khammam</option>
                            <option>Komaram Bheem Asifabad</option>
                            <option>Mahabubabad</option>
                            <option>Mahabubnagar</option>
                            <option>Mancherial</option>
                            <option>Medak</option>
                            <option>Medchal-Malkajgiri</option>
                            <option>Mulugu</option>
                            <option>Nagarkurnool</option>
                            <option>Nalgonda</option>
                            <option>Narayanpet</option>
                            <option>Nirmal</option>
                            <option>Nizamabad</option>
                            <option>Peddapalli</option>
                            <option>Rajanna Sircilla</option>
                            <option>Rangareddy</option>
                            <option>Sangareddy</option>
                            <option>Siddipet</option>
                            <option>Suryapet</option>
                            <option>Vikarabad</option>
                            <option>Wanaparthy</option>
                            <option>Warangal</option>
                            <option>Yadadri Bhuvanagiri</option>
                        </select>
                    </div>
                    <div class="job-app-field" style="grid-column:1/-1;">
                        <label for="jobAddress">Address *</label>
                        <input type="text" id="jobAddress" required placeholder="Your complete address">
                    </div>
                    <div class="job-app-field" style="grid-column:1/-1;">
                        <label for="jobSkills">Key Skills *</label>
                        <textarea id="jobSkills" required placeholder="List your key skills (e.g., Communication, MS Office, Sales)"></textarea>
                    </div>
                    <div class="job-app-field" style="grid-column:1/-1;">
                        <label for="jobMessage">Why do you want to join GVCDA? *</label>
                        <textarea id="jobMessage" required placeholder="Tell us about yourself and why you're interested in this position"></textarea>
                    </div>
                </div>
                <div class="job-app-actions">
                    <button type="button" class="job-app-cancel" onclick="closeJobApplication()">Cancel</button>
                    <button type="submit" class="job-app-submit">Submit Application</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function openJobApplication() {
    document.getElementById('jobApplicationModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeJobApplication() {
    document.getElementById('jobApplicationModal').classList.remove('show');
    document.body.style.overflow = '';
    document.getElementById('jobApplicationForm').reset();
}
function submitJobApplication(event) {
    event.preventDefault();
    const formData = {
        name: document.getElementById('jobName').value.trim(),
        phone: document.getElementById('jobPhone').value.trim(),
        email: document.getElementById('jobEmail').value.trim(),
        age: document.getElementById('jobAge').value,
        qualification: document.getElementById('jobQualification').value.trim(),
        experience: document.getElementById('jobExperience').value,
        position: document.getElementById('jobPosition').value,
        district: document.getElementById('jobDistrict').value,
        address: document.getElementById('jobAddress').value.trim(),
        skills: document.getElementById('jobSkills').value.trim(),
        message: document.getElementById('jobMessage').value.trim(),
        appliedAt: new Date().toISOString()
    };
    console.log('Job Application Submitted:', formData);
    alert('✅ Thank you! Your job application has been submitted successfully. We will contact you soon.');
    closeJobApplication();
}
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
    
    # Add CSS before </head>
    if '</head>' in content and '.job-app-modal' not in content:
        content = content.replace('</head>', css_block)
    
    # Add button after Employee button
    pattern1 = r'(<a href="employee-login\.html" class="ncta"[^>]*>.*?</a>)(<a href="tel:\+917981660705")'
    if re.search(pattern1, content, re.DOTALL) and 'Job Application' not in content:
        content = re.sub(pattern1, r'\1' + button_html + r'\2', content, flags=re.DOTALL)
    
    # Add modal and script before </body>
    if '</body>' in content and 'jobApplicationModal' not in content:
        content = content.replace('</body>', modal_html)
    
    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated {page_path}")

print("\n✅ All pages updated successfully!")
