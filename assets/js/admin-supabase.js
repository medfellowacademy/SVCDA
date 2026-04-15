/**
 * Admin Panel with Supabase Integration
 * SVCDA Platform - Admin Dashboard
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

      byId('totalMembers').textContent = members.length;
      byId('premiumMembers').textContent = premium;
      byId('serviceRequests').textContent = activity.filter(a => a.type === 'Service Request').length;
      byId('todayActivity').textContent = todayActive;
      byId('totalEmployees').textContent = employees.length;
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
        return '<tr>' +
          '<td>' + (m.name || '-') + '</td>' +
          '<td>' + (m.phone || '-') + '</td>' +
          '<td>' + (m.plan || 'Registered') + '</td>' +
          '<td>' + (m.card_number || '-') + '</td>' +
          '<td>' + (m.amount ? '₹' + m.amount : '-') + '</td>' +
          '<td>' + (m.payment_id ? '<small style="color:#666;">' + m.payment_id.substring(0, 20) + '...</small>' : '-') + '</td>' +
          '<td>' + (m.added_by_name || 'Direct/Website') + '</td>' +
          '<td>' + formatDate(m.created_at) + '</td>' +
          '<td>' + formatDate(m.updated_at) + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="9">No members found</td></tr>';
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

  // Render all sections
  async function renderAll() {
    await Promise.all([
      renderStats(),
      renderMembers(),
      renderActivity(),
      renderEmployees(),
      loadTwilioSettings()
    ]);
  }

  // Initialize authentication
  async function initAuth() {
    try {
      // Get admin PIN from Supabase settings
      let adminPin = await db.settings.get(ADMIN_PIN_KEY);
      if (!adminPin) {
        // Set default PIN
        await db.settings.set(ADMIN_PIN_KEY, 'admin123');
        adminPin = 'admin123';
      }

      byId('loginBtn').addEventListener('click', async function () {
        const inputPin = byId('adminPin').value;
        const currentPin = await db.settings.get(ADMIN_PIN_KEY);
        
        if (inputPin !== currentPin) {
          byId('loginError').textContent = 'Invalid PIN';
          return;
        }
        
        byId('loginWrap').style.display = 'none';
        byId('panelWrap').style.display = 'block';
        await renderAll();
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      alert('Error connecting to database. Please check your Supabase configuration.');
    }
  }

  // Load Twilio configuration into form fields
  async function loadTwilioSettings() {
    try {
      const config = await loadTwilioConfig();
      if (config && config.accountSid) {
        byId('twilioAccountSid').value = config.accountSid || '';
        byId('twilioAuthToken').value = config.authToken || '';
        byId('twilioPhoneNumber').value = config.phoneNumber || '';
        byId('twilioWhatsAppNumber').value = config.whatsappNumber || '';
      }
    } catch (error) {
      console.error('Error loading Twilio settings:', error);
    }
  }

  // Initialize actions and event listeners
  function initActions() {
    // Search filters
    byId('memberSearch').addEventListener('input', renderMembers);
    byId('activitySearch').addEventListener('input', renderActivity);

    // Refresh button
    byId('refreshData').addEventListener('click', renderAll);

    // Save Twilio Configuration
    byId('saveTwilioConfig').addEventListener('click', async function () {
      const accountSid = byId('twilioAccountSid').value.trim();
      const authToken = byId('twilioAuthToken').value.trim();
      const phoneNumber = byId('twilioPhoneNumber').value.trim();
      const whatsappNumber = byId('twilioWhatsAppNumber').value.trim();

      if (!accountSid || !authToken) {
        alert('Please enter at least Account SID and Auth Token');
        return;
      }

      const config = {
        accountSid: accountSid,
        authToken: authToken,
        phoneNumber: phoneNumber,
        whatsappNumber: whatsappNumber
      };

      try {
        await saveTwilioConfig(config);
        alert('✅ Twilio configuration saved successfully!\n\nYou can now test the connection or send notifications.');
      } catch (error) {
        console.error('Error saving Twilio config:', error);
        alert('❌ Error saving Twilio configuration: ' + error.message);
      }
    });

    // Test Twilio Connection
    byId('testTwilioConfig').addEventListener('click', async function () {
      try {
        const result = await verifyTwilioConfig();
        if (result.success) {
          alert('✅ Twilio connection successful!\n\nAccount: ' + result.accountName + '\nStatus: ' + result.status);
        } else {
          alert('❌ Twilio connection failed: ' + result.error);
        }
      } catch (error) {
        console.error('Error testing Twilio:', error);
        alert('❌ Error testing Twilio: ' + error.message + '\n\nMake sure you have saved your Twilio credentials first.');
      }
    });

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

    // Export members CSV
    byId('exportMembers').addEventListener('click', async function () {
      try {
        const members = await db.members.getAll();
        const csv = toCSV(members, ['id', 'name', 'phone', 'email', 'plan', 'card_number', 'amount', 'payment_id', 'added_by_name', 'location', 'created_at', 'updated_at']);
        downloadCSV('svcda-members.csv', csv);
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
        downloadCSV('svcda-activity.csv', csv);
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

    // Load SMS webhook value
    db.settings.get('sms_webhook').then(webhook => {
      if (webhook) {
        byId('smsWebhook').value = webhook;
      }
    });
  }

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
