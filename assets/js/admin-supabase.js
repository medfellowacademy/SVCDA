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
        const safePhone = (m.phone || '').replace(/'/g, "\\'");
        const safeName = (m.name || '').replace(/'/g, "\\'");
        const safeCard = (m.card_number || '').replace(/'/g, "\\'");
        const safeLocation = (m.location || '').replace(/'/g, "\\'");
        const safePlan = (m.plan || 'Premium').replace(/'/g, "\\'");
        const safeAmount = String(m.amount || '');
        return '<tr>' +
          '<td><input type="checkbox" class="member-checkbox" value="' + m.id + '"></td>' +
          '<td>' + (m.name || '-') + '</td>' +
          '<td>' + (m.phone || '-') + '</td>' +
          '<td>' + (m.plan || 'Registered') + '</td>' +
          '<td>' + (m.card_number || '-') + '</td>' +
          '<td>' + (m.amount ? '₹' + m.amount : '-') + '</td>' +
          '<td>' + (m.payment_id ? '<small style="color:#666;">' + m.payment_id.substring(0, 20) + '...</small>' : '-') + '</td>' +
          '<td>' + (m.added_by_name || 'Direct/Website') + '</td>' +
          '<td>' + formatDate(m.created_at) + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<button onclick="adminDownloadCard(\'' + safeCard + '\',\'' + safeName + '\',\'' + safePhone + '\',\'' + safeLocation + '\',\'' + safePlan + '\',\'' + safeAmount + '\')" ' +
              'style="padding:4px 10px;font-size:0.8rem;background:#667eea;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-right:4px;">⬇ Card</button>' +
            '<button onclick="adminSendCard(\'' + safePhone + '\',\'' + safeName + '\',\'' + safeCard + '\')" ' +
              'style="padding:4px 10px;font-size:0.8rem;background:#25d366;color:#fff;border:none;border-radius:6px;cursor:pointer;">📤 WhatsApp</button>' +
          '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="10">No members found</td></tr>';
    } catch (error) {
      console.error('Error rendering members:', error);
      byId('membersBody').innerHTML = '<tr><td colspan="10">Error loading members</td></tr>';
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
        const empUsers = members.filter(m => m.added_by === emp.id);
        const empPremium = empUsers.filter(m => m.plan === 'Premium');

        return '<tr>' +
          '<td>' + emp.id.substring(0, 8) + '...</td>' +
          '<td>' + (emp.name || '-') + '</td>' +
          '<td>' + (emp.email || '-') + '</td>' +
          '<td><strong>' + empUsers.length + '</strong></td>' +
          '<td><strong>' + empPremium.length + '</strong></td>' +
          '<td>' + formatDate(emp.last_login) + '</td>' +
          '<td><button onclick="removeEmployee(\'' + emp.id + '\', \'' + emp.email + '\')">Remove</button></td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="7">No employees added yet</td></tr>';
    } catch (error) {
      console.error('Error rendering employees:', error);
      byId('employeesBody').innerHTML = '<tr><td colspan="7">Error loading employees</td></tr>';
    }
  }

  // Remove employee
  window.removeEmployee = async function(employeeId, email) {
    if (!confirm('Remove employee ' + email + '? Their added users will remain.')) return;
    
    try {
      // In production, add a proper delete endpoint or use Supabase delete
      // For now, we'll update their status
      await db.employees.update(employeeId, { status: 'inactive' });
      alert('Employee removed successfully');
      renderAll();
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('Error removing employee: ' + error.message);
    }
  };

  // Render job applications table
  async function renderJobApplications() {
    try {
      const searchTerm = (byId('jobAppSearch')?.value || '').toLowerCase().trim();
      const statusFilter = byId('jobAppStatusFilter')?.value || '';
      let applications;

      if (searchTerm) {
        applications = await db.job_applications.search(searchTerm);
        if (statusFilter) {
          applications = applications.filter(app => app.status === statusFilter);
        }
      } else if (statusFilter) {
        applications = await db.job_applications.getByStatus(statusFilter);
      } else {
        applications = await db.job_applications.getAll();
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

  // Helper: open admin panel after successful auth
  async function openAdminPanel() {
    byId('loginWrap').style.display = 'none';
    byId('panelWrap').style.display = 'block';
    await renderAll();
  }

  // Initialize authentication
  async function initAuth() {
    // ── Admin Email / Password login (role-based) ─────────────────
    const emailLoginBtn = byId('adminEmailLoginBtn');
    if (emailLoginBtn) {
      emailLoginBtn.addEventListener('click', async function () {
        const email    = (byId('adminEmail')?.value || '').trim();
        const password = (byId('adminPassword')?.value || '').trim();
        const errEl    = byId('loginError');

        if (!email || !password) {
          errEl.textContent = 'Please enter email and password.';
          return;
        }

        emailLoginBtn.disabled = true;
        emailLoginBtn.textContent = 'Checking...';

        try {
          const employee = await db.employees.getByEmail(email);
          if (!employee) throw new Error('No employee found with this email.');
          if (employee.password !== password) throw new Error('Incorrect password.');
          if (employee.role !== 'admin') throw new Error('Access denied — your account does not have admin privileges.');

          // Store session so returning visits work
          sessionStorage.setItem('currentEmployee', JSON.stringify(employee));
          await openAdminPanel();
        } catch (err) {
          errEl.textContent = '❌ ' + (err.message || 'Login failed');
          emailLoginBtn.disabled = false;
          emailLoginBtn.textContent = 'Login with Account';
        }
      });
    }

    // ── PIN fallback login ────────────────────────────────────────
    try {
      let adminPin = 'admin123';
      try {
        const storedPin = await db.settings.get(ADMIN_PIN_KEY);
        if (storedPin) adminPin = storedPin;
        else await db.settings.set(ADMIN_PIN_KEY, 'admin123');
      } catch (dbError) {
        console.warn('Supabase not configured, using default PIN:', dbError);
      }

      byId('loginBtn').addEventListener('click', async function () {
        const inputPin = byId('adminPin').value;
        let currentPin = adminPin;
        try {
          const storedPin = await db.settings.get(ADMIN_PIN_KEY);
          if (storedPin) currentPin = storedPin;
        } catch (dbError) { /* use default */ }

        if (inputPin !== currentPin) {
          byId('loginError').textContent = 'Invalid PIN. Try "admin123"';
          return;
        }
        await openAdminPanel();
      });
    } catch (error) {
      console.error('Error initializing PIN auth:', error);
      byId('loginBtn').addEventListener('click', function () {
        const inputPin = byId('adminPin').value;
        if (inputPin !== 'admin123') {
          byId('loginError').textContent = 'Invalid PIN. Default is "admin123"';
          return;
        }
        renderAll().catch(err => {
          console.error('Error loading data:', err);
          alert('Warning: Database connection issue. Some features may not work.');
        });
        byId('loginWrap').style.display = 'none';
        byId('panelWrap').style.display = 'block';
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

  // Initialize actions and event listeners
  function initActions() {
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

      if (!name || !email) {
        alert('Please enter employee name and email');
        return;
      }

      // Auto-generate a secure password
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
      let password = '';
      for (var i = 0; i < 10; i++) password += chars[Math.floor(Math.random() * chars.length)];

      try {
        await db.employees.create({
          name: name,
          email: email,
          password: password,
          role: 'employee',
          status: 'active'
        });

        // Show credentials once — copy and share with employee
        alert('✅ Employee added!\n\nShare these login credentials with the employee:\n\n📧 Email: ' + email + '\n🔑 Password: ' + password + '\n\n⚠️ Copy this now — password will not be shown again.');

        // Clear form
        byId('newEmpName').value = '';
        byId('newEmpEmail').value = '';
        
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

  // Admin-only: download premium card as image
  window.adminDownloadCard = function(cardNumber, name, phone, location, plan, amount) {
    const W = 900, H = 506;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // --- Background ---
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1a2151');
    bg.addColorStop(1, '#0f1535');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 20);
    ctx.fill();

    // Decorative circles (top right)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#4a6cf7';
    ctx.beginPath(); ctx.arc(760, 80, 140, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(840, 200, 100, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // --- GVCDA title top-left ---
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Arial';
    ctx.fillText('GVCDA', 48, 82);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '17px Arial';
    ctx.fillText('Glob Village & City Development Agency', 48, 110);

    // --- PREMIUM badge top-right ---
    const badgeX = 680, badgeY = 40, badgeW = 180, badgeH = 42;
    const badgeGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0);
    badgeGrad.addColorStop(0, '#f5a623');
    badgeGrad.addColorStop(1, '#f9c84a');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 21);
    ctx.fill();
    ctx.fillStyle = '#1a2151';
    ctx.font = 'bold 18px Arial';
    const badgeLabel = (plan || 'PREMIUM').toUpperCase();
    const labelW = ctx.measureText(badgeLabel).width;
    ctx.fillText(badgeLabel, badgeX + (badgeW - labelW) / 2, badgeY + 27);

    // --- Chip (credit-card style) ---
    const chipX = 48, chipY = 138, chipW = 58, chipH = 44;
    const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
    chipGrad.addColorStop(0, '#f5c842');
    chipGrad.addColorStop(1, '#e0a800');
    ctx.fillStyle = chipGrad;
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, chipH, 6);
    ctx.fill();
    // Chip lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(chipX + 19, chipY); ctx.lineTo(chipX + 19, chipY + chipH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(chipX + 39, chipY); ctx.lineTo(chipX + 39, chipY + chipH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(chipX, chipY + 16); ctx.lineTo(chipX + chipW, chipY + 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(chipX, chipY + 28); ctx.lineTo(chipX + chipW, chipY + 28); ctx.stroke();

    // --- Card number (spaced groups) ---
    const cn = (cardNumber || 'GVCDA00000000').toUpperCase();
    // Split into groups of 4 after first 4
    const part1 = cn.substring(0, 4);
    const part2 = cn.substring(4, 8);
    const part3 = cn.substring(8, 12);
    const part4 = cn.substring(12);
    const cnDisplay = [part1, part2, part3, part4].filter(Boolean).join('    ');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText(cnDisplay, 48, 278);
    ctx.letterSpacing = '0px';

    // --- Member Name ---
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px Arial';
    ctx.fillText('MEMBER NAME', 48, 318);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText((name || '-').toUpperCase(), 48, 350);

    // --- Valid Till ---
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const mm = String(validUntil.getMonth() + 1).padStart(2, '0');
    const yyyy = validUntil.getFullYear();
    const validStr = mm + '/' + yyyy;

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px Arial';
    ctx.fillText('VALID TILL', 600, 318);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(validStr, 600, 350);

    // --- Footer bar ---
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 390, W, 116);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 15px Arial';
    const footerMain = 'Globe Village & City Development Agency  •  +91 9908011124  •  www.gvcdaservicehub.com';
    ctx.fillText(footerMain, 48, 430);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '13px Arial';
    ctx.fillText('Membership Card  |  Valid for 1 Year from Date of Issue  |  Non-Transferable', 48, 460);

    // --- Download card PNG ---
    const cardDataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'GVCDA-Card-' + (cardNumber || 'member') + '.png';
    link.href = cardDataUrl;
    link.click();

    // --- Generate membership PDF ---
    setTimeout(function() {
      adminGenerateMembershipPDF(cardNumber, name, phone, location, plan, amount, cardDataUrl);
    }, 500);
  };

  // Generate and download membership PDF
  window.adminGenerateMembershipPDF = function(cardNumber, name, phone, location, plan, amount, cardDataUrl) {
    if (typeof window.jspdf === 'undefined') {
      alert('PDF library not loaded. Please refresh and try again.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const validStr = validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const issueStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    function drawHeader() {
      doc.setFillColor(26, 33, 81);
      doc.rect(0, 0, W, 42, 'F');
      doc.setFillColor(245, 166, 35);
      doc.rect(0, 0, W, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.text('GVCDA', 14, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 210, 255);
      doc.text('Globe Village & City Development Agency', 14, 29);
      doc.text('+91 9908011124  |  www.gvcdaservicehub.com', 14, 36);
      doc.setFillColor(245, 166, 35);
      doc.roundedRect(152, 11, 44, 13, 3, 3, 'F');
      doc.setTextColor(26, 33, 81);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text((plan || 'PREMIUM').toUpperCase(), 174, 19.5, { align: 'center' });
    }

    function drawFooter() {
      doc.setFillColor(26, 33, 81);
      doc.rect(0, H - 12, W, 12, 'F');
      doc.setTextColor(180, 190, 220);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Membership Card  |  Valid for 1 Year from Date of Issue  |  Non-Transferable  |  www.gvcdaservicehub.com', W / 2, H - 4, { align: 'center' });
    }

    // ══════════════════════════════
    // PAGE 1 — Certificate + Card
    // ══════════════════════════════
    drawHeader();

    doc.setTextColor(26, 33, 81);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('MEMBERSHIP CERTIFICATE', W / 2, 55, { align: 'center' });
    doc.setDrawColor(245, 166, 35);
    doc.setLineWidth(0.8);
    doc.line(65, 58, 145, 58);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 90);
    doc.text('This is to certify that the following individual has been registered as a', W / 2, 66, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 166, 35);
    doc.text('GVCDA Premium Member', W / 2, 73, { align: 'center' });

    // Member details box
    doc.setFillColor(245, 247, 255);
    doc.setDrawColor(180, 190, 230);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, 79, W - 28, 66, 4, 4, 'FD');

    var r = 92;
    function detRow(l1, v1, l2, v2) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 155);
      doc.text(l1, 22, r);
      if (l2) doc.text(l2, 118, r);
      r += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(26, 33, 81);
      doc.text(v1 || '-', 22, r);
      if (v2) doc.text(v2 || '-', 118, r);
      r += 9;
    }
    detRow('MEMBER NAME', (name || '-').toUpperCase(), 'CARD NUMBER', cardNumber || '-');
    detRow('PHONE', phone || '-', 'PLAN', (plan || 'Premium') + ' Membership');
    detRow('DATE OF ISSUE', issueStr, 'VALID UNTIL', validStr);

    // Welcome letter
    doc.setDrawColor(220, 225, 240);
    doc.setLineWidth(0.3);
    doc.line(14, 150, W - 14, 150);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 55, 70);
    var letter = 'Dear ' + (name || 'Member') + ',\n\nCongratulations and a warm welcome to the GVCDA family!\n\nWe are pleased to inform you that your Membership Card has been successfully issued. We warmly welcome you to the GVCDA family and look forward to your active participation in our community development initiatives.\n\nYour membership provides access to various programs, services, training opportunities, and networking platforms offered by GVCDA. Together, let\'s build stronger villages and smarter cities.\n\nThank you for your trust and support.';
    var letterLines = doc.splitTextToSize(letter, W - 28);
    doc.text(letterLines, 14, 158);
    var afterLetter = 158 + letterLines.length * 4.8;

    // Card image
    if (cardDataUrl) {
      afterLetter += 4;
      var cardW = 175, cardH = Math.round(175 * 506 / 900);
      doc.addImage(cardDataUrl, 'PNG', (W - cardW) / 2, afterLetter, cardW, cardH);
      afterLetter += cardH + 8;
    }

    // Signature
    var sigY = Math.max(afterLetter, 258);
    doc.setDrawColor(180, 190, 220);
    doc.setLineWidth(0.4);
    doc.line(14, sigY, 65, sigY);
    doc.line(W - 65, sigY, W - 14, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 155);
    doc.text('Member Signature', 14, sigY + 5);
    doc.text('Authorized Signatory', W - 14, sigY + 5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(26, 33, 81);
    doc.text('GVCDA', W - 14, sigY + 11, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 155);
    doc.text('Globe Village & City Development Agency LLP', W - 14, sigY + 16, { align: 'right' });

    drawFooter();

    // ══════════════════════════════
    // PAGE 2 — All Services
    // ══════════════════════════════
    doc.addPage();
    drawHeader();

    doc.setFillColor(245, 166, 35);
    doc.rect(14, 48, W - 28, 10, 'F');
    doc.setTextColor(26, 33, 81);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('OUR SERVICES — AVAILABLE TO PREMIUM MEMBERS', W / 2, 55.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 65, 80);
    doc.text('As a GVCDA Premium Member, you get priority access and up to 50% discount on all services below.', W / 2, 66, { align: 'center' });

    var services = [
      { num: '1', title: 'Health & Medical Services', items: ['All medicines up to 50% discount', 'Free health camps & doctor consultation', 'Health insurance enrollment', 'Ambulance by reference'] },
      { num: '2', title: 'Business Sector Support', items: ['Local business promotion', 'Social media & website creation', 'Labor/Trade/Udyam registration', 'GST & accounting support'] },
      { num: '3', title: 'Home Needs Services', items: ['Home repair & maintenance', 'Plumbing & electrical help', 'Water purifier & appliance service', 'Pest control & cleaning'] },
      { num: '4', title: 'Advertising Services', items: ['Local ads across all media', 'Design, printing & promotions', 'Social media branding', 'Video & photography'] },
      { num: '5', title: 'Thrift & Credit Services', items: ['SHG savings & thrift programs', 'Micro-credit & loan facilitation', 'Banking correspondent services', 'Financial literacy'] },
      { num: '6', title: 'Employment & Job Placement', items: ['Govt. & private job alerts', 'Resume building & interview prep', 'Skill-matching to jobs', 'Self-employment guidance'] },
      { num: '7', title: 'Skill Development & Training', items: ['Vocational & trade training', 'Computer & digital literacy', 'Tailoring, beauty & food business', 'Entrepreneurship development'] },
      { num: '8', title: 'Women Empowerment', items: ['SHG formation & microfinance', 'Skill training for women', 'Legal aid & protection awareness', 'Domestic product marketing'] },
      { num: '9', title: 'Grocery & Daily Essentials', items: ['Ration & grocery delivery', 'Bulk discounted purchasing', 'Fresh vegetables & dairy', 'Monthly subscription baskets'] },
      { num: '10', title: 'Electronics & Technology', items: ['Mobile, laptop & appliance repair', 'Purchase assistance', 'Internet & broadband setup', 'Cyber security awareness'] },
      { num: '11', title: 'Education & Coaching', items: ['School & college admission guidance', 'Private hostels & coaching reference', 'Exam preparation resources', 'All training references'] },
      { num: '12', title: 'Order & Delivery Services', items: ['Doorstep product delivery', 'Custom order placement', 'Bulk order discounts', 'Packaging & logistics'] },
    ];

    var colW = (W - 28) / 2;
    var svcY = 72;
    var colors = [[26,33,81],[15,90,60],[120,40,10],[80,20,100],[10,80,100],[100,60,10]];

    services.forEach(function(svc, i) {
      var col = i % 2 === 0 ? 14 : 14 + colW + 4;
      if (i % 2 === 0 && i > 0) svcY += 38;
      var ci = Math.floor(i / 2) % colors.length;
      var c = colors[ci];

      // Service title bar
      doc.setFillColor(c[0], c[1], c[2]);
      doc.roundedRect(col, svcY, colW - 4, 9, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(svc.num + '. ' + svc.title, col + 3, svcY + 6.2);

      // Items
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 45, 60);
      svc.items.forEach(function(item, j) {
        doc.setTextColor(c[0], c[1], c[2]);
        doc.text('•', col + 3, svcY + 14 + j * 6);
        doc.setTextColor(40, 45, 60);
        doc.text(item, col + 8, svcY + 14 + j * 6);
      });
    });

    // Insurance highlight box
    var boxY = svcY + 42;
    doc.setFillColor(26, 33, 81);
    doc.roundedRect(14, boxY, W - 28, 14, 3, 3, 'F');
    doc.setTextColor(245, 166, 35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Rs.10 Lakhs Personal Accident Insurance', W / 2, boxY + 6, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Included FREE with every Premium Membership  |  Coverage for all registered members', W / 2, boxY + 11.5, { align: 'center' });

    drawFooter();

    doc.save('GVCDA-Membership-' + (cardNumber || 'member') + '.pdf');
  };

  // Admin-only: send card details to member via WhatsApp
  window.adminSendCard = function(phone, name, cardNumber) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const validStr = validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const message = `🌟 *GVCDA Premium Membership Card*

Dear ${name},

Your GVCDA Premium membership is now active!

📧 *Membership Details:*
━━━━━━━━━━━━━━━━━━
Card Number: *${cardNumber}*
Member Name: ${name}
Plan: *Premium Membership*
Amount Paid: ₹1499
Valid Until: *${validStr}*
━━━━━━━━━━━━━━━━━━

📎 *Membership card & PDF attached*

Need help? Call: +91 9908011124
www.gvcdaservicehub.com

Thank you for joining GVCDA (Globe Village & City Development Agency) as a valued member.

We are pleased to inform you that your Membership Card has been successfully issued. We warmly welcome you to the GVCDA family and look forward to your active participation in our community development initiatives.

Your membership provides access to various programs, services, training opportunities, and networking platforms offered by GVCDA.

Thank you for your trust and support. Together, let's build stronger villages and smarter cities.

Best Regards,

GVCDA
(Globe Village & City Development Agency LLP)

*Team GVCDA* 🙏`;

    const url = 'https://wa.me/91' + cleanPhone + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    // Check if Supabase is loaded
    if (typeof supabase === 'undefined' || typeof db === 'undefined') {
      alert('Supabase not loaded. Please check supabase-config.js and ensure your credentials are set.');
      return;
    }

    initAuth();
    initActions();
  });
})();
