/**
 * Admin Panel with Supabase Integration
 * GVCDA Platform - Admin Dashboard
 */

(function () {
  const ADMIN_PIN_KEY = 'admin_pin';

  function byId(id) { return document.getElementById(id); }

  // Format date helper
  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  }

  // CSV export helper
  function toCSV(rows, columns) {
    const lines = [columns.join(',')];
    rows.forEach(function (row) {
      const line = columns.map(function (col) {
        const v = row[col] == null ? '' : String(row[col]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(',');
      lines.push(line);
    });
    return lines.join('\n');
  }

  function downloadCSV(name, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Render statistics
  async function renderStats() {
    try {
      const members = await db.members.getAll();
      const activity = await db.activity.getAll();
      const employees = await db.employees.getAll();

      const premium = members.filter(m => m.plan === 'Premium').length;
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayActive = activity.filter(a => {
        const timestamp = a.timestamp || '';
        return String(timestamp).slice(0, 10) === todayKey;
      }).length;

      // Calculate revenue
      const totalRevenue = members.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
      const today = new Date();
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();
      
      const monthRevenue = members.filter(m => {
        const created = new Date(m.created_at);
        return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
      }).reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
      
      const todayRevenue = members.filter(m => {
        return String(m.created_at || '').slice(0, 10) === todayKey;
      }).reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

      byId('totalMembers').textContent = members.length;
      byId('premiumMembers').textContent = premium;
      byId('serviceRequests').textContent = activity.filter(a => a.type === 'Service Request').length;
      byId('todayActivity').textContent = todayActive;
      byId('totalEmployees').textContent = employees.length;
      byId('totalRevenue').textContent = '₹' + totalRevenue.toLocaleString('en-IN');
      byId('monthRevenue').textContent = '₹' + monthRevenue.toLocaleString('en-IN');
      byId('todayRevenue').textContent = '₹' + todayRevenue.toLocaleString('en-IN');
    } catch (error) {
      console.error('Error rendering stats:', error);
    }
  }

  // Render members table
  async function renderMembers() {
    try {
      const searchTerm = (byId('memberSearch').value || '').toLowerCase().trim();
      let members;

      if (searchTerm) {
        members = await db.members.search(searchTerm);
      } else {
        members = await db.members.getAll();
      }

      const body = byId('membersBody');
      body.innerHTML = members.map(m => {
        const mid = m.id || '';
        return '<tr>' +
          '<td><input type="checkbox" class="member-checkbox" data-member-id="' + mid + '"></td>' +
          '<td>' + (m.name || '-') + '</td>' +
          '<td>' + (m.phone || '-') + '</td>' +
          '<td>' + (m.plan || 'Registered') + '</td>' +
          '<td>' + (m.card_number || '-') + '</td>' +
          '<td>' + (m.amount ? '₹' + m.amount : '-') + '</td>' +
          '<td>' + (m.payment_id ? '<small style="color:#666;">' + m.payment_id.substring(0, 20) + '...</small>' : '-') + '</td>' +
          '<td>' + (m.added_by_name || 'Direct/Website') + '</td>' +
          '<td>' + formatDate(m.created_at) + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<button onclick="adminSendCard(' + JSON.stringify(m).replace(/"/g,"'") + ')" style="padding:4px 10px;font-size:.8rem;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:6px;cursor:pointer;margin-right:5px;">Send Card</button>' +
            '<button onclick="adminQuickWA(\'' + (m.phone||'') + '\',\'' + (m.name||'').replace(/'/g,"\\'") + '\')" style="padding:4px 10px;font-size:.8rem;background:#25d366;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-right:5px;">WhatsApp</button>' +
            '<button onclick="deleteMember(\'' + mid + '\')" style="padding:4px 10px;font-size:.8rem;background:#dc2626;color:#fff;border:none;border-radius:6px;cursor:pointer;">Delete</button>' +
          '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="10">No members found</td></tr>';
    } catch (error) {
      console.error('Error rendering members:', error);
      byId('membersBody').innerHTML = '<tr><td colspan="9">Error loading members</td></tr>';
    }
  }

  // Render activity table
  async function renderActivity() {
    try {
      const searchTerm = (byId('activitySearch').value || '').toLowerCase().trim();
      let activity;

      if (searchTerm) {
        activity = await db.activity.search(searchTerm);
      } else {
        activity = await db.activity.getAll();
      }

      const body = byId('activityBody');
      body.innerHTML = activity.slice(0, 300).map(a => {
        return '<tr>' +
          '<td>' + formatDate(a.timestamp) + '</td>' +
          '<td>' + (a.type || '-') + '</td>' +
          '<td>' + (a.member_name || '-') + '</td>' +
          '<td>' + (a.phone || '-') + '</td>' +
          '<td>' + (a.service || '-') + '</td>' +
          '<td>' + (a.payment || '-') + '</td>' +
          '<td>' + (a.added_by_name || 'Direct/Website') + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="7">No activity found</td></tr>';
    } catch (error) {
      console.error('Error rendering activity:', error);
      byId('activityBody').innerHTML = '<tr><td colspan="7">Error loading activity</td></tr>';
    }
  }

  // Render employees table
  async function renderEmployees() {
    try {
      const employees = await db.employees.getAll();
      const members = await db.members.getAll();
      const body = byId('employeesBody');

      body.innerHTML = employees.map(emp => {
        const empUsers   = members.filter(m => m.added_by === emp.id);
        const empPremium = empUsers.filter(m => m.plan === 'Premium');
        const isActive   = (emp.status || 'active') === 'active';
        const statusBadge = isActive
          ? '<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:600;">Active</span>'
          : '<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:600;">Inactive</span>';

        const empJson = encodeURIComponent(JSON.stringify({ id: emp.id, name: emp.name || '', email: emp.email || '', status: emp.status || 'active' }));

        return '<tr>' +
          '<td style="font-family:monospace;font-size:.8rem;">' + emp.id.substring(0, 10) + '…</td>' +
          '<td><strong>' + (emp.name || '-') + '</strong></td>' +
          '<td>' + (emp.email || '-') + '</td>' +
          '<td><strong>' + empUsers.length + '</strong></td>' +
          '<td><strong>' + empPremium.length + '</strong></td>' +
          '<td>' + formatDate(emp.last_login) + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<button onclick="openEditEmpModal(\'' + empJson + '\')" style="padding:5px 12px;border:none;border-radius:6px;background:#667eea;color:#fff;font-weight:600;cursor:pointer;font-size:.82rem;margin-right:6px;">Edit</button>' +
            '<button onclick="deleteEmployee(\'' + emp.id + '\', \'' + (emp.email || '') + '\')" style="padding:5px 12px;border:none;border-radius:6px;background:#ef4444;color:#fff;font-weight:600;cursor:pointer;font-size:.82rem;">Delete</button>' +
          '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="8" style="text-align:center;color:#999;padding:30px;">No employees added yet</td></tr>';
    } catch (error) {
      console.error('Error rendering employees:', error);
      byId('employeesBody').innerHTML = '<tr><td colspan="8">Error loading employees</td></tr>';
    }
  }

  // Open edit modal
  window.openEditEmpModal = function(encodedData) {
    const emp = JSON.parse(decodeURIComponent(encodedData));
    byId('editEmpId').value       = emp.id;
    byId('editEmpName').value     = emp.name;
    byId('editEmpEmail').value    = emp.email;
    byId('editEmpPassword').value = '';
    byId('editEmpStatus').value   = emp.status || 'active';
    const modal = byId('editEmpModal');
    modal.style.display = 'flex';
  };

  window.closeEditEmpModal = function() {
    byId('editEmpModal').style.display = 'none';
  };

  // Close modal on backdrop click
  document.addEventListener('click', function(e) {
    const modal = byId('editEmpModal');
    if (modal && e.target === modal) modal.style.display = 'none';
  });

  window.saveEditEmployee = async function() {
    const id       = byId('editEmpId').value;
    const name     = byId('editEmpName').value.trim();
    const email    = byId('editEmpEmail').value.trim();
    const password = byId('editEmpPassword').value.trim();
    const status   = byId('editEmpStatus').value;

    if (!name || !email) { alert('Name and email are required.'); return; }

    const updates = { name, email, status };
    if (password) updates.password = password;

    try {
      await db.employees.update(id, updates);
      closeEditEmpModal();
      await renderEmployees();
      await renderStats();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Error updating employee: ' + error.message);
    }
  };

  // Delete employee permanently
  window.deleteEmployee = async function(employeeId, email) {
    if (!confirm('Permanently delete employee ' + email + '?\n\nTheir added members will remain in the system.')) return;
    try {
      await db.employees.delete(employeeId);
      await renderEmployees();
      await renderStats();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee: ' + error.message);
    }
  };

  // Merge job applications from localStorage into a Supabase result set
  function mergeLocalJobApplications(supabaseApps) {
    try {
      const localApps = JSON.parse(localStorage.getItem('gvcda_job_applications') || '[]');
      if (!localApps.length) return supabaseApps;
      const supabaseIds = new Set(supabaseApps.map(a => a.id));
      const newLocal = localApps.filter(a => !supabaseIds.has(a.id));
      const merged = [...supabaseApps, ...newLocal];
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return merged;
    } catch (e) {
      return supabaseApps;
    }
  }

  // Render job applications table
  async function renderJobApplications() {
    try {
      const searchTerm = (byId('jobAppSearch')?.value || '').toLowerCase().trim();
      const statusFilter = byId('jobAppStatusFilter')?.value || '';
      let applications;

      if (searchTerm) {
        applications = await db.job_applications.search(searchTerm);
        applications = mergeLocalJobApplications(applications);
        const q = searchTerm;
        applications = applications.filter(app =>
          (app.name || '').toLowerCase().includes(q) ||
          (app.phone || '').toLowerCase().includes(q) ||
          (app.email || '').toLowerCase().includes(q) ||
          (app.position || '').toLowerCase().includes(q) ||
          (app.district || '').toLowerCase().includes(q)
        );
        if (statusFilter) {
          applications = applications.filter(app => app.status === statusFilter);
        }
      } else if (statusFilter) {
        applications = await db.job_applications.getByStatus(statusFilter);
        applications = mergeLocalJobApplications(applications);
        applications = applications.filter(app => app.status === statusFilter);
      } else {
        applications = await db.job_applications.getAll();
        applications = mergeLocalJobApplications(applications);
      }

      const body = byId('jobApplicationsBody');
      if (!body) return;

      body.innerHTML = applications.map(app => {
        const statusColors = {
          'pending': '#f59e0b',
          'reviewed': '#3b82f6',
          'shortlisted': '#10b981',
          'rejected': '#ef4444',
          'hired': '#059669'
        };
        const statusColor = statusColors[app.status] || '#6b7280';

        return '<tr>' +
          '<td>' + formatDate(app.created_at) + '</td>' +
          '<td>' + (app.name || '-') + '</td>' +
          '<td>' + (app.phone || '-') + '</td>' +
          '<td>' + (app.email || '-') + '</td>' +
          '<td>' + (app.position || '-') + '</td>' +
          '<td>' + (app.experience ? app.experience + ' yrs' : '-') + '</td>' +
          '<td>' + (app.district || '-') + '</td>' +
          '<td><span style="color:' + statusColor + ';font-weight:600;">' + (app.status || 'pending') + '</span></td>' +
          '<td>' +
            '<button onclick="viewJobApplication(\'' + app.id + '\')" style="padding:4px 8px;font-size:0.8rem;margin-right:4px;">View</button>' +
            '<select onchange="updateJobAppStatus(\'' + app.id + '\', this.value)" style="padding:4px;font-size:0.8rem;">' +
              '<option value="">Change Status</option>' +
              '<option value="reviewed">Reviewed</option>' +
              '<option value="shortlisted">Shortlisted</option>' +
              '<option value="rejected">Rejected</option>' +
              '<option value="hired">Hired</option>' +
            '</select>' +
          '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="9">No job applications found</td></tr>';
    } catch (error) {
      console.error('Error rendering job applications:', error);
      const body = byId('jobApplicationsBody');
      if (body) body.innerHTML = '<tr><td colspan="9">Error loading job applications</td></tr>';
    }
  }

  // View job application details
  window.viewJobApplication = async function(appId) {
    try {
      const applications = await db.job_applications.getAll();
      const app = applications.find(a => a.id === appId);
      if (!app) {
        alert('Application not found');
        return;
      }

      const details = `
Job Application Details:

Name: ${app.name}
Phone: ${app.phone}
Email: ${app.email}
Age: ${app.age || 'N/A'}
Qualification: ${app.qualification || 'N/A'}
Experience: ${app.experience || 0} years
Position: ${app.position}
District: ${app.district}
Address: ${app.address || 'N/A'}

Skills: ${app.skills || 'N/A'}

Why join GVCDA:
${app.message || 'N/A'}

Status: ${app.status || 'pending'}
Applied: ${formatDate(app.created_at)}
      `;

      alert(details);
    } catch (error) {
      console.error('Error viewing application:', error);
      alert('Error loading application details');
    }
  };

  // Update job application status
  window.updateJobAppStatus = async function(appId, newStatus) {
    if (!newStatus) return;
    
    try {
      await db.job_applications.update(appId, { status: newStatus });
      alert('Application status updated to: ' + newStatus);
      await renderJobApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status: ' + error.message);
    }
  };

  // Render payments table
  async function renderPayments() {
    try {
      const searchTerm = (byId('paymentsSearch')?.value || '').toLowerCase().trim();
      const dateFilter = byId('paymentsDateFilter')?.value || '';
      let payments;

      if (searchTerm) {
        payments = await db.payments.search(searchTerm);
      } else if (dateFilter) {
        payments = await db.payments.getFiltered(dateFilter);
      } else {
        payments = await db.payments.getAll();
      }

      const body = byId('paymentsBody');
      if (!body) return;

      body.innerHTML = payments.map(payment => {
        return '<tr>' +
          '<td>' + formatDate(payment.created_at) + '</td>' +
          '<td>' + (payment.name || '-') + '</td>' +
          '<td>' + (payment.phone || '-') + '</td>' +
          '<td>' + (payment.email || '-') + '</td>' +
          '<td><strong>₹' + (payment.amount || 0) + '</strong></td>' +
          '<td><small style="color:#666;">' + (payment.razorpay_payment_id || '-').substring(0, 20) + '...</small></td>' +
          '<td>' + (payment.method || '-') + '</td>' +
          '<td><span style="color:#10b981;font-weight:600;">' + (payment.status || 'success') + '</span></td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="8">No payments found</td></tr>';
    } catch (error) {
      console.error('Error rendering payments:', error);
      const body = byId('paymentsBody');
      if (body) body.innerHTML = '<tr><td colspan="8">Error loading payments</td></tr>';
    }
  }

  // Export job applications to CSV
  byId('exportJobApps')?.addEventListener('click', async function() {
    try {
      const apps = await db.job_applications.getAll();
      const columns = ['name', 'phone', 'email', 'age', 'qualification', 'experience', 'position', 'district', 'address', 'skills', 'message', 'status', 'created_at'];
      const csv = toCSV(apps, columns);
      downloadCSV('job_applications_' + new Date().toISOString().slice(0, 10) + '.csv', csv);
    } catch (error) {
      console.error('Error exporting job applications:', error);
      alert('Error exporting data');
    }
  });

  // Export payments to CSV
  byId('exportPayments')?.addEventListener('click', async function() {
    try {
      const payments = await db.payments.getAll();
      const columns = ['created_at', 'name', 'phone', 'email', 'amount', 'razorpay_payment_id', 'razorpay_order_id', 'method', 'status'];
      const csv = toCSV(payments, columns);
      downloadCSV('payments_' + new Date().toISOString().slice(0, 10) + '.csv', csv);
    } catch (error) {
      console.error('Error exporting payments:', error);
      alert('Error exporting data');
    }
  });

  // Add search functionality
  byId('jobAppSearch')?.addEventListener('input', renderJobApplications);
  byId('jobAppStatusFilter')?.addEventListener('change', renderJobApplications);
  byId('paymentsSearch')?.addEventListener('input', renderPayments);
  byId('paymentsDateFilter')?.addEventListener('change', renderPayments);

  // Render all sections
  async function renderAll() {
    await Promise.all([
      renderStats(),
      renderMembers(),
      renderActivity(),
      renderEmployees(),
      renderJobApplications(),
      renderPayments()
    ]);
    // Render charts after data is loaded
    await renderAdvancedAnalytics();
  }

  // Initialize authentication
  async function initAuth() {
    try {
      let adminPin = 'admin123'; // Default PIN
      
      // Try to get PIN from Supabase if available
      try {
        const storedPin = await db.settings.get(ADMIN_PIN_KEY);
        if (storedPin) {
          adminPin = storedPin;
        } else {
          // Try to set default PIN in Supabase
          await db.settings.set(ADMIN_PIN_KEY, 'admin123');
        }
      } catch (dbError) {
        console.warn('Supabase not configured, using default PIN:', dbError);
        // Continue with default PIN
      }

      byId('loginBtn').addEventListener('click', async function () {
        const inputPin = byId('adminPin').value;
        
        // Try to get current PIN from Supabase, fallback to default
        let currentPin = adminPin;
        try {
          const storedPin = await db.settings.get(ADMIN_PIN_KEY);
          if (storedPin) {
            currentPin = storedPin;
          }
        } catch (dbError) {
          console.warn('Using default PIN');
        }
        
        if (inputPin !== currentPin) {
          byId('loginError').textContent = 'Invalid PIN. Try "admin123"';
          return;
        }
        
        byId('loginWrap').style.display = 'none';
        byId('panelWrap').style.display = 'block';
        await renderAll();
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Still allow login with default PIN even if there's an error
      byId('loginBtn').addEventListener('click', function () {
        const inputPin = byId('adminPin').value;
        
        if (inputPin !== 'admin123') {
          byId('loginError').textContent = 'Invalid PIN. Default is "admin123"';
          return;
        }
        
        byId('loginWrap').style.display = 'none';
        byId('panelWrap').style.display = 'block';
        renderAll().catch(err => {
          console.error('Error loading data:', err);
          alert('Warning: Database connection issue. Some features may not work.');
        });
      });
    }
  }

  // Advanced Analytics with Charts
  let chartInstances = {};

  async function renderAdvancedAnalytics() {
    try {
      const members = await db.members.getAll();
      const employees = await db.employees.getAll();
      
      // Monthly Trends Chart
      renderMonthlyTrendsChart(members);
      
      // Plan Distribution Chart
      renderPlanDistributionChart(members);
      
      // Employee Performance Chart
      renderEmployeePerformanceChart(members, employees);
      
    } catch (error) {
      console.error('Error rendering advanced analytics:', error);
    }
  }

  function renderMonthlyTrendsChart(members) {
    const monthlyData = {};
    const last6Months = [];
    const today = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[key] = 0;
      last6Months.push(key);
    }
    
    // Count members per month
    members.forEach(m => {
      const created = new Date(m.created_at);
      const key = created.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyData.hasOwnProperty(key)) {
        monthlyData[key]++;
      }
    });
    
    const counts = last6Months.map(month => monthlyData[month]);
    
    // Destroy existing chart
    if (chartInstances.monthlyTrends) {
      chartInstances.monthlyTrends.destroy();
    }
    
    const canvas = document.createElement('canvas');
    canvas.style.maxHeight = '200px';
    const container = byId('monthlyTrendsChart');
    container.innerHTML = '';
    container.appendChild(canvas);
    
    chartInstances.monthlyTrends = new Chart(canvas, {
      type: 'line',
      data: {
        labels: last6Months,
        datasets: [{
          label: 'New Members',
          data: counts,
          borderColor: '#0B1120',
          backgroundColor: 'rgba(11, 17, 32, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  function renderPlanDistributionChart(members) {
    const planCounts = {};
    members.forEach(m => {
      const plan = m.plan || 'Basic';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });
    
    const labels = Object.keys(planCounts);
    const data = Object.values(planCounts);
    const colors = ['#0B1120', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
    
    // Destroy existing chart
    if (chartInstances.planDistribution) {
      chartInstances.planDistribution.destroy();
    }
    
    const canvas = document.createElement('canvas');
    canvas.style.maxHeight = '200px';
    const container = byId('planDistributionChart');
    container.innerHTML = '';
    container.appendChild(canvas);
    
    chartInstances.planDistribution = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  }

  function renderEmployeePerformanceChart(members, employees) {
    const empPerformance = {};
    
    employees.forEach(emp => {
      empPerformance[emp.name] = 0;
    });
    
    members.forEach(m => {
      const empName = m.added_by_name;
      if (empName && empName !== 'Website' && empName !== 'Direct/Website') {
        empPerformance[empName] = (empPerformance[empName] || 0) + 1;
      }
    });
    
    // Sort and get top 5
    const sorted = Object.entries(empPerformance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const labels = sorted.map(e => e[0]);
    const data = sorted.map(e => e[1]);
    
    // Destroy existing chart
    if (chartInstances.employeePerformance) {
      chartInstances.employeePerformance.destroy();
    }
    
    const canvas = document.createElement('canvas');
    canvas.style.maxHeight = '200px';
    const container = byId('employeePerformanceChart');
    container.innerHTML = '';
    container.appendChild(canvas);
    
    chartInstances.employeePerformance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Members Added',
          data: data,
          backgroundColor: '#0B1120'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  // Make renderAdvancedAnalytics available globally
  window.renderAdvancedAnalytics = renderAdvancedAnalytics;

  // Quick WhatsApp opener for admin panel
  window.adminQuickWA = function(phone, name) {
    const p   = (phone || '').replace(/\D/g, '');
    const num = p.startsWith('91') ? p : '91' + p;
    const msg = 'Hello ' + name + ', this is GVCDA. How can we help you today?';
    window.open('https://web.whatsapp.com/send?phone=' + num + '&text=' + encodeURIComponent(msg), '_blank');
  };

  // Send Card + PDF + WhatsApp message from admin panel
  window.adminSendCard = async function(member) {
    if (!member || !member.phone) { alert('No phone number for this member.'); return; }

    const jspdfLib = window.jspdf && window.jspdf.jsPDF;
    if (!jspdfLib) { alert('PDF library not loaded. Please refresh and try again.'); return; }

    // Valid till calculation
    const validTillFull = (function() {
      if (member.valid_till) {
        try { return new Date(member.valid_till).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }); } catch(e) {}
      }
      if (member.created_at) {
        const d = new Date(member.created_at); d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
      }
      return 'Lifetime';
    })();
    const validTillShort = (function() {
      if (member.valid_till) {
        try { const d = new Date(member.valid_till); return (d.getMonth()+1).toString().padStart(2,'0')+'/'+d.getFullYear(); } catch(e) {}
      }
      if (member.created_at) {
        const d = new Date(member.created_at); d.setFullYear(d.getFullYear() + 1);
        return (d.getMonth()+1).toString().padStart(2,'0')+'/'+d.getFullYear();
      }
      return 'Lifetime';
    })();

    // ── Build E-Card Canvas ──
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 560;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 900, 560);
    grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(0.5, '#16213e'); grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 900, 560);
    ctx.fillStyle = 'rgba(102,126,234,0.15)'; ctx.beginPath(); ctx.arc(780, 80, 200, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(118,75,162,0.10)'; ctx.beginPath(); ctx.arc(120, 480, 160, 0, Math.PI*2); ctx.fill();
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
    ctx.strokeStyle='rgba(102,126,234,0.6)'; ctx.lineWidth=2; rr(18,18,864,524,22); ctx.stroke();
    ctx.fillStyle='#ffffff'; ctx.font='bold 52px Arial'; ctx.fillText('GVCDA',54,84);
    ctx.font='14px Arial'; ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillText('Glob Village & City Development Agency',54,108);
    const pg=ctx.createLinearGradient(680,44,820,44); pg.addColorStop(0,'#f6d365'); pg.addColorStop(1,'#fda085');
    ctx.fillStyle=pg; rr(674,42,148,36,18); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.fillText('PREMIUM',706,65);
    ctx.fillStyle='rgba(255,255,255,0.12)'; rr(54,148,88,66,10); ctx.fill();
    ctx.fillStyle='rgba(255,215,0,0.9)'; ctx.fillRect(64,158,68,46);
    const cardNum=(member.card_number||'GVCDA000000');
    const fmt=cardNum.match(/.{1,4}/g)?.join('  ')||cardNum;
    ctx.font='bold 34px Courier New'; ctx.fillStyle='#ffffff'; ctx.letterSpacing='2px'; ctx.fillText(fmt,54,270);
    ctx.font='11px Arial'; ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillText('MEMBER NAME',54,320);
    ctx.font='bold 26px Arial'; ctx.fillStyle='#ffffff'; ctx.fillText((member.name||'Member').toUpperCase(),54,352);
    ctx.font='11px Arial'; ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillText('VALID TILL',600,320);
    ctx.font='bold 22px Arial'; ctx.fillStyle='#ffffff'; ctx.fillText(validTillShort,600,352);
    const bg2=ctx.createLinearGradient(0,440,900,440); bg2.addColorStop(0,'rgba(102,126,234,0.3)'); bg2.addColorStop(1,'rgba(118,75,162,0.3)');
    ctx.fillStyle=bg2; ctx.fillRect(0,438,900,122);
    ctx.font='13px Arial'; ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillText('Globe Village & City Development Agency  •  +91 9908011124  •  www.gvcdaservicehub.com',62,472);
    ctx.font='11px Arial'; ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillText('Membership Card  |  Valid for 1 Year from Date of Issue  |  Non-Transferable',62,496);

    // ── Helper: blob download ──
    function blobDL(url, name) {
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); },400);
    }

    // ── Download PNG ──
    const pngBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    blobDL(URL.createObjectURL(pngBlob), 'GVCDA_Card_' + (member.card_number||member.name).replace(/\s+/g,'_') + '.png');

    // ── Build & Download PDF ──
    await new Promise(r => setTimeout(r, 400));
    try {
      const pdf = new jspdfLib({ orientation:'portrait', unit:'mm', format:'a4' });
      const PW = pdf.internal.pageSize.getWidth(), PH = pdf.internal.pageSize.getHeight();
      // Page 1
      pdf.setFillColor(26,26,46); pdf.rect(0,0,PW,36,'F');
      pdf.setTextColor(255,255,255); pdf.setFontSize(18); pdf.setFont('helvetica','bold');
      pdf.text('GVCDA Premium Membership Card',PW/2,16,{align:'center'});
      pdf.setFontSize(9); pdf.setFont('helvetica','normal');
      pdf.text('Glob Village & City Development Agency  |  www.gvcdaservicehub.com',PW/2,26,{align:'center'});
      const imgData = canvas.toDataURL('image/png');
      const cW=PW-28, cH=cW*(560/900);
      pdf.addImage(imgData,'PNG',14,40,cW,cH);
      let dy=44+cH;
      pdf.setFillColor(248,250,255); pdf.setDrawColor(210,220,245); pdf.roundedRect(14,dy,PW-28,52,3,3,'FD');
      pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(40,40,40);
      const dets=[['Member Name',member.name||'-'],['Card Number',member.card_number||'-'],['Plan',member.plan||'Premium'],['Amount Paid','Rs.'+(member.amount||'1499')],['Valid Until',validTillFull],['Phone',member.phone||'-']];
      dets.forEach(([k,v],i)=>{const col=i%2,row=Math.floor(i/2),sx=14+col*(PW-28)/2,sy=dy+8+row*14;pdf.setFont('helvetica','bold');pdf.setTextColor(102,126,234);pdf.text(k+':',sx+3,sy);pdf.setFont('helvetica','normal');pdf.setTextColor(40,40,40);pdf.text(v,sx+3,sy+6);});
      pdf.setFillColor(102,126,234); pdf.rect(0,PH-16,PW,16,'F');
      pdf.setTextColor(255,255,255); pdf.setFontSize(8);
      pdf.text('Globe Village & City Development Agency  |  +91 9908011124  |  www.gvcdaservicehub.com',PW/2,PH-8,{align:'center'});
      // Page 2 - Services
      pdf.addPage();
      pdf.setFillColor(102,126,234); pdf.rect(0,0,PW,26,'F');
      pdf.setTextColor(255,255,255); pdf.setFontSize(14); pdf.setFont('helvetica','bold');
      pdf.text('Our Services — Available to Premium Members',PW/2,11,{align:'center'});
      pdf.setFontSize(8); pdf.setFont('helvetica','normal');
      pdf.text('As a GVCDA Premium Member, you get priority access and up to 50% discount on all services below.',PW/2,21,{align:'center'});
      const svcs=[
        {t:'Health & Medical Services',i:['All medicines up to 50% discount','Free health camps & doctor consultation','Health insurance enrollment','Ambulance by reference']},
        {t:'Business Sector Support',i:['Local business promotion','Social media & website creation','Labor/Trade/Udyam registration','GST & accounting support']},
        {t:'Home Needs Services',i:['Home repair & maintenance','Plumbing & electrical help','Water purifier & appliance service','Pest control & cleaning']},
        {t:'Advertising Services',i:['Local ads across all media','Design, printing & promotions','Social media branding','Video & photography']},
        {t:'Thrift & Credit Services',i:['SHG savings & thrift programs','Micro-credit & loan facilitation','Banking correspondent services','Financial literacy']},
        {t:'Employment & Job Placement',i:['Govt. & private job alerts','Resume building & interview prep','Skill-matching to jobs','Self-employment guidance']},
        {t:'Skill Development & Training',i:['Vocational & trade training','Computer & digital literacy','Tailoring, beauty & food business','Entrepreneurship development']},
        {t:'Women Empowerment',i:['SHG formation & microfinance','Skill training for women','Legal aid & protection awareness','Domestic product marketing']},
        {t:'Grocery & Daily Essentials',i:['Ration & grocery delivery','Bulk discounted purchasing','Fresh vegetables & dairy','Monthly subscription baskets']},
        {t:'Electronics & Technology',i:['Mobile, laptop & appliance repair','Purchase assistance','Internet & broadband setup','Cyber security awareness']},
        {t:'Education & Coaching',i:['School & college admission guidance','Private hostels & coaching reference','Exam preparation resources','All training references']},
        {t:'Order & Delivery Services',i:['Doorstep product delivery','Custom order placement','Bulk order discounts','Packaging & logistics']},
      ];
      let sy=30, cW2=(PW-28)/2;
      svcs.forEach((s,i)=>{
        const col=i%2, sx=14+col*(cW2+4), bH=38;
        if(col===0&&i>0) sy+=bH+3;
        if(sy+bH>PH-20){pdf.addPage();pdf.setFillColor(102,126,234);pdf.rect(0,0,PW,26,'F');pdf.setTextColor(255,255,255);pdf.setFontSize(12);pdf.setFont('helvetica','bold');pdf.text('GVCDA — Services Continued',14,17);sy=32;}
        pdf.setFillColor(248,250,255); pdf.setDrawColor(210,220,245); pdf.roundedRect(sx,sy,cW2,bH,2,2,'FD');
        pdf.setFillColor(102,126,234); pdf.roundedRect(sx,sy,cW2,10,2,2,'F'); pdf.rect(sx,sy+5,cW2,5,'F');
        pdf.setTextColor(255,255,255); pdf.setFontSize(7.5); pdf.setFont('helvetica','bold'); pdf.text((i+1)+'. '+s.t,sx+3,sy+7);
        pdf.setFontSize(6.8); pdf.setFont('helvetica','normal'); pdf.setTextColor(40,40,40);
        s.i.slice(0,4).forEach((it,j)=>pdf.text('• '+it,sx+3,sy+14+j*6));
      });
      pdf.setFillColor(102,126,234); pdf.rect(0,PH-16,PW,16,'F');
      pdf.setTextColor(255,255,255); pdf.setFontSize(8);
      pdf.text('Globe Village & City Development Agency  |  +91 9908011124  |  www.gvcdaservicehub.com',PW/2,PH-8,{align:'center'});

      // ── Page 3: Terms & Conditions ──
      pdf.addPage();
      pdf.setFillColor(30,40,80); pdf.rect(0,0,PW,28,'F');
      pdf.setTextColor(255,255,255); pdf.setFontSize(15); pdf.setFont('helvetica','bold');
      pdf.text('GVCDA Membership Card — Terms & Conditions',PW/2,12,{align:'center'});
      pdf.setFontSize(8); pdf.setFont('helvetica','normal');
      pdf.text('Global Village and City Development Agency LLP (GVCDA)',PW/2,22,{align:'center'});
      const tnc=[
        {n:'1.',t:'Membership Fee',b:'Rs. 1,499.'},
        {n:'2.',t:'Membership Validity',b:'The membership card is valid for 1 year from the date of activation.'},
        {n:'3.',t:'Free Insurance Benefit',b:'Members are eligible for insurance coverage for 2 years, subject to the insurer\'s terms, conditions, eligibility criteria, exclusions, and claim procedures.'},
        {n:'4.',t:'Discount Benefits',b:'Members may receive discounts of up to 50% from participating partners, merchants, and service providers. Discounts may vary depending on the offer and partner.'},
        {n:'5.',t:'Guidance Services',b:'Members are entitled to guidance and consultation services as offered by GVCDA from time to time.'},
        {n:'6.',t:'Career Support',b:'Members may access career guidance, mentoring, training, and support services provided by GVCDA.'},
        {n:'7.',t:'Consultant Services',b:'Members may avail consultant and advisory services as per GVCDA programs, policies, and service availability.'},
        {n:'8.',t:'Non-Transferable Membership',b:'Membership cards are issued exclusively to the registered member and are non-transferable.'},
        {n:'9.',t:'Modification of Benefits',b:'GVCDA reserves the right to modify, update, suspend, or discontinue membership benefits, offers, services, and partner programs at any time without prior notice.'},
        {n:'10.',t:'No Refund Policy',b:'The membership fee of Rs. 1,499 is non-refundable and non-transferable. Once the membership card has been issued and activated, it cannot be cancelled, exchanged, or refunded, either in full or in part.'},
        {n:'11.',t:'Acceptance of Terms',b:'By purchasing and using the GVCDA Membership Card, the member agrees to abide by all applicable terms and conditions of the membership program.'},
      ];
      let ty=36;
      tnc.forEach(item=>{
        pdf.setFillColor(30,40,80); pdf.roundedRect(14,ty,6,6,1,1,'F');
        pdf.setTextColor(255,255,255); pdf.setFontSize(6); pdf.setFont('helvetica','bold');
        pdf.text(item.n,17,ty+4.2,{align:'center'});
        pdf.setTextColor(20,30,70); pdf.setFontSize(8.5); pdf.setFont('helvetica','bold');
        pdf.text(item.t,23,ty+4.5);
        pdf.setTextColor(50,50,50); pdf.setFontSize(7.5); pdf.setFont('helvetica','normal');
        const lines=pdf.splitTextToSize(item.b,PW-28);
        pdf.text(lines,23,ty+10);
        ty+=10+lines.length*4.5+3;
      });
      ty+=4;
      pdf.setDrawColor(180,180,200); pdf.line(14,ty,PW-14,ty); ty+=6;
      pdf.setFontSize(8); pdf.setFont('helvetica','bold'); pdf.setTextColor(30,40,80);
      pdf.text('Authorized by:',14,ty); ty+=5;
      pdf.setFont('helvetica','normal'); pdf.setTextColor(50,50,50);
      pdf.text('Global Village and City Development Agency LLP (GVCDA)',14,ty);
      pdf.setFillColor(30,40,80); pdf.rect(0,PH-16,PW,16,'F');
      pdf.setTextColor(255,255,255); pdf.setFontSize(7.5); pdf.setFont('helvetica','normal');
      pdf.text('Globe Village & City Development Agency  |  +91 9908011124  |  www.gvcdaservicehub.com',PW/2,PH-8,{align:'center'});
      pdf.text('This document is system-generated. For queries contact your GVCDA agent.',PW/2,PH-2,{align:'center'});

      const pdfBlob = pdf.output('blob');
      blobDL(URL.createObjectURL(pdfBlob), 'GVCDA_Membership_' + (member.card_number||member.name).replace(/\s+/g,'_') + '.pdf');
    } catch(e) { console.error('PDF error:',e); }

    // ── Open WhatsApp with message ──
    await new Promise(r => setTimeout(r, 800));
    const raw = (member.phone||'').replace(/\D/g,'');
    const num = raw.startsWith('91') ? raw : '91'+raw;
    const msg =
      '🌟 *GVCDA Premium Membership Card*\n\n' +
      'Dear ' + member.name + ',\n\n' +
      'Your GVCDA Premium membership is now active!\n\n' +
      '📧 *Membership Details:*\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      'Card Number: *' + (member.card_number||'-') + '*\n' +
      'Member Name: ' + member.name + '\n' +
      'Plan: *Premium Membership*\n' +
      'Amount Paid: ₹' + (member.amount||'1499') + '\n' +
      'Valid Until: *' + validTillFull + '*\n' +
      '━━━━━━━━━━━━━━━━━━\n\n' +
      '📎 *Membership card & PDF attached*\n\n' +
      'Need help? Call: +91 9908011124\n' +
      'www.gvcdaservicehub.com\n\n' +
      'Thank you for joining GVCDA (Glob Village & City Development Agency) as a valued member.\n\n' +
      'We are pleased to inform you that your Membership Card has been successfully issued. We warmly welcome you to the GVCDA family and look forward to your active participation in our community development initiatives.\n\n' +
      'Your membership provides access to various programs, services, training opportunities, and networking platforms offered by GVCDA.\n\n' +
      'Thank you for your trust and support. Together, let\'s build stronger villages and smarter cities.\n\n' +
      'Best Regards,\n\nGVCDA\n(Glob Village & City Development Agency LLP)\n\n*Team GVCDA* 🙏';
    window.open('https://web.whatsapp.com/send?phone=' + num + '&text=' + encodeURIComponent(msg), '_blank');
  };

  // Delete a single member
  window.deleteMember = async function(memberId) {
    if (!memberId) return;
    if (!confirm('Delete this member? This cannot be undone.')) return;
    try {
      if (window.db && window.db.members && window.db.members.delete) {
        await window.db.members.delete(memberId);
      }
      // Also remove from localStorage
      try {
        const local = JSON.parse(localStorage.getItem('gvcda_members') || '[]');
        localStorage.setItem('gvcda_members', JSON.stringify(local.filter(m => m.id !== memberId)));
      } catch (e) {}
      await renderMembers();
      await renderStats();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Error deleting member: ' + error.message);
    }
  };

  // Initialize actions and event listeners
  function initActions() {
    // Select-all checkbox
    byId('selectAllMembers').addEventListener('change', function () {
      document.querySelectorAll('.member-checkbox').forEach(cb => { cb.checked = this.checked; });
    });

    // Search filters
    byId('memberSearch').addEventListener('input', renderMembers);
    byId('activitySearch').addEventListener('input', renderActivity);

    // Refresh button
    byId('refreshData').addEventListener('click', renderAll);

    // Update admin PIN
    byId('savePin').addEventListener('click', async function () {
      const newPin = byId('newPin').value.trim();
      if (!newPin || newPin.length < 4) {
        alert('PIN must be at least 4 characters.');
        return;
      }
      
      try {
        await db.settings.set(ADMIN_PIN_KEY, newPin);
        alert('Admin PIN updated successfully');
        byId('newPin').value = '';
      } catch (error) {
        console.error('Error updating PIN:', error);
        alert('Error updating PIN: ' + error.message);
      }
    });

    // Save MSG91 Configuration
    byId('saveMsg91Config').addEventListener('click', async function () {
      const authKey = byId('msg91AuthKey').value.trim();
      const senderId = byId('msg91SenderId').value.trim();
      const dltId = byId('msg91DltId').value.trim();

      if (!authKey || !senderId) {
        alert('Please enter at least Auth Key and Sender ID');
        return;
      }

      const config = {
        authKey: authKey,
        senderId: senderId,
        dltId: dltId
      };

      try {
        await db.settings.set('msg91_config', JSON.stringify(config));
        alert('✅ MSG91 configuration saved successfully!');
      } catch (error) {
        console.error('Error saving MSG91 config:', error);
        alert('❌ Error saving MSG91 configuration: ' + error.message);
      }
    });

    // Test MSG91 Configuration
    byId('testMsg91Config').addEventListener('click', async function () {
      alert('ℹ️ SMS testing requires MSG91 environment variables to be set in your .env file.\n\nPlease use the actual registration flow to test SMS notifications.');
    });

    // Export members CSV
    byId('exportMembers').addEventListener('click', async function () {
      try {
        const members = await db.members.getAll();
        const csv = toCSV(members, ['id', 'name', 'phone', 'email', 'plan', 'card_number', 'amount', 'payment_id', 'added_by_name', 'location', 'created_at', 'updated_at']);
        downloadCSV('gvcda-members.csv', csv);
      } catch (error) {
        console.error('Error exporting members:', error);
        alert('Error exporting data: ' + error.message);
      }
    });

    // Export activity CSV
    byId('exportActivity').addEventListener('click', async function () {
      try {
        const activity = await db.activity.getAll();
        const csv = toCSV(activity, ['id', 'timestamp', 'type', 'member_name', 'phone', 'service', 'payment', 'added_by_name']);
        downloadCSV('gvcda-activity.csv', csv);
      } catch (error) {
        console.error('Error exporting activity:', error);
        alert('Error exporting data: ' + error.message);
      }
    });

    // Add employee
    byId('addEmployee').addEventListener('click', async function () {
      const name = byId('newEmpName').value.trim();
      const email = byId('newEmpEmail').value.trim();
      const password = byId('newEmpPassword').value.trim() || 'emp123';

      if (!name || !email) {
        alert('Please enter employee name and email');
        return;
      }

      try {
        await db.employees.create({
          name: name,
          email: email,
          password: password,
          role: 'employee',
          status: 'active'
        });

        alert('Employee added successfully!\n\nEmail: ' + email + '\nPassword: ' + password);
        
        // Clear form
        byId('newEmpName').value = '';
        byId('newEmpEmail').value = '';
        byId('newEmpPassword').value = '';
        
        // Refresh employees table
        await renderEmployees();
        await renderStats();
      } catch (error) {
        console.error('Error adding employee:', error);
        alert('Error adding employee: ' + error.message);
      }
    });

    // Load MSG91 configuration
    db.settings.get('msg91_config').then(config => {
      if (config) {
        try {
          const parsed = JSON.parse(config);
          if (byId('msg91AuthKey')) byId('msg91AuthKey').value = parsed.authKey || '';
          if (byId('msg91SenderId')) byId('msg91SenderId').value = parsed.senderId || '';
          if (byId('msg91DltId')) byId('msg91DltId').value = parsed.dltId || '';
        } catch (e) {
          console.error('Error loading MSG91 config:', e);
        }
      }
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof db === 'undefined') {
      alert('Config not loaded. Please check supabase-config.js is included before this script.');
      return;
    }
    initAuth();
    initActions();
  });
})();
