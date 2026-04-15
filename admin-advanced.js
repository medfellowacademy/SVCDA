/**
 * Advanced Admin Panel Features
 * SVCDA Platform - Enhanced Analytics & Management
 * 
 * Features:
 * - Real-time charts and analytics
 * - Advanced filtering and sorting
 * - Bulk operations (delete, SMS, export)
 * - Member edit/delete functionality
 * - Performance metrics
 * - Data visualization
 */

(function() {
  'use strict';

  // ==================== CHART VISUALIZATION ====================
  
  /**
   * Create a simple bar chart using HTML/CSS (no external libraries)
   */
  function createBarChart(elementId, data, labels) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const maxValue = Math.max(...data);
    let html = '<div style="display: flex; align-items: flex-end; gap: 15px; height: 200px; padding: 10px;">';
    
    data.forEach((value, index) => {
      const height = maxValue > 0 ? (value / maxValue) * 180 : 0;
      const label = labels[index] || `Item ${index + 1}`;
      
      html += `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;">
          <div style="width: 100%; background: linear-gradient(180deg, #667eea 0%, #764ba2 100%); 
                      height: ${height}px; border-radius: 8px 8px 0 0; transition: all 0.3s;
                      display: flex; align-items: flex-start; justify-content: center; padding-top: 8px;">
            <span style="color: white; font-weight: 700; font-size: 14px;">${value}</span>
          </div>
          <span style="font-size: 12px; color: #666; font-weight: 600;">${label}</span>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Create a simple pie chart visualization
   */
  function createPieChart(elementId, data, labels, colors) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const total = data.reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No data available</p>';
      return;
    }

    let html = '<div style="display: flex; gap: 30px; align-items: center; padding: 20px;">';
    
    // Create simple ring visualization
    html += '<div style="flex: 0 0 200px; height: 200px; position: relative;">';
    let currentAngle = 0;
    
    data.forEach((value, index) => {
      const percentage = ((value / total) * 100).toFixed(1);
      const color = colors[index] || `hsl(${index * 60}, 70%, 60%)`;
      const angle = (value / total) * 360;
      
      html += `
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; 
                    background: conic-gradient(${color} ${currentAngle}deg ${currentAngle + angle}deg, transparent 0deg);"></div>
      `;
      currentAngle += angle;
    });
    
    html += '</div>';
    
    // Legend
    html += '<div style="flex: 1;">';
    data.forEach((value, index) => {
      const percentage = ((value / total) * 100).toFixed(1);
      const label = labels[index] || `Item ${index + 1}`;
      const color = colors[index] || `hsl(${index * 60}, 70%, 60%)`;
      
      html += `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <div style="width: 20px; height: 20px; background: ${color}; border-radius: 4px;"></div>
          <span style="flex: 1; font-size: 14px; color: #333;">${label}</span>
          <span style="font-weight: 700; color: #667eea;">${value} (${percentage}%)</span>
        </div>
      `;
    });
    html += '</div>';
    
    html += '</div>';
    container.innerHTML = html;
  }

  // ==================== ANALYTICS & METRICS ====================
  
  /**
   * Calculate and display advanced analytics
   */
  async function renderAdvancedAnalytics() {
    try {
      const members = await db.members.getAll();
      const activity = await db.activity.getAll();
      const employees = await db.employees.getAll();

      // Monthly registration trends (last 6 months)
      const monthlyData = calculateMonthlyTrends(members);
      createBarChart('monthlyTrendsChart', monthlyData.counts, monthlyData.labels);

      // Plan distribution
      const planData = calculatePlanDistribution(members);
      createPieChart('planDistributionChart', planData.counts, planData.labels, 
                     ['#667eea', '#764ba2', '#f093fb', '#4facfe']);

      // Employee performance
      const empData = calculateEmployeePerformance(members, employees);
      createBarChart('employeePerformanceChart', empData.counts, empData.labels);

      // Revenue analytics
      const revenueData = calculateRevenueMetrics(members);
      updateRevenueDisplay(revenueData);

    } catch (error) {
      console.error('❌ Error rendering analytics:', error);
    }
  }

  /**
   * Calculate monthly registration trends
   */
  function calculateMonthlyTrends(members) {
    const months = [];
    const counts = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'short' });
      
      const count = members.filter(m => {
        if (!m.created_at) return false;
        const mDate = new Date(m.created_at);
        const mKey = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`;
        return mKey === monthKey;
      }).length;
      
      months.push(monthLabel);
      counts.push(count);
    }
    
    return { labels: months, counts };
  }

  /**
   * Calculate plan distribution
   */
  function calculatePlanDistribution(members) {
    const plans = {};
    
    members.forEach(m => {
      const plan = m.plan || 'Unknown';
      plans[plan] = (plans[plan] || 0) + 1;
    });
    
    return {
      labels: Object.keys(plans),
      counts: Object.values(plans)
    };
  }

  /**
   * Calculate employee performance
   */
  function calculateEmployeePerformance(members, employees) {
    const empStats = {};
    
    employees.forEach(emp => {
      empStats[emp.name || emp.email] = 0;
    });
    
    members.forEach(m => {
      const empName = m.added_by_name || 'Website';
      empStats[empName] = (empStats[empName] || 0) + 1;
    });
    
    const sorted = Object.entries(empStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 employees
    
    return {
      labels: sorted.map(e => e[0]),
      counts: sorted.map(e => e[1])
    };
  }

  /**
   * Calculate revenue metrics
   */
  function calculateRevenueMetrics(members) {
    let totalRevenue = 0;
    let monthRevenue = 0;
    let todayRevenue = 0;
    
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    members.forEach(m => {
      const amount = parseFloat(m.amount) || 0;
      totalRevenue += amount;
      
      if (m.created_at) {
        const mDate = new Date(m.created_at);
        if (mDate.toDateString() === today) {
          todayRevenue += amount;
        }
        if (mDate.getMonth() === thisMonth && mDate.getFullYear() === thisYear) {
          monthRevenue += amount;
        }
      }
    });
    
    return { totalRevenue, monthRevenue, todayRevenue };
  }

  /**
   * Update revenue display
   */
  function updateRevenueDisplay(data) {
    const containers = {
      total: document.getElementById('totalRevenue'),
      month: document.getElementById('monthRevenue'),
      today: document.getElementById('todayRevenue')
    };
    
    if (containers.total) containers.total.textContent = `₹${data.totalRevenue.toLocaleString('en-IN')}`;
    if (containers.month) containers.month.textContent = `₹${data.monthRevenue.toLocaleString('en-IN')}`;
    if (containers.today) containers.today.textContent = `₹${data.todayRevenue.toLocaleString('en-IN')}`;
  }

  // ==================== BULK OPERATIONS ====================
  
  /**
   * Get selected member IDs from checkboxes
   */
  function getSelectedMemberIds() {
    const checkboxes = document.querySelectorAll('.member-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.memberId);
  }

  /**
   * Bulk delete members
   */
  async function bulkDeleteMembers() {
    const selectedIds = getSelectedMemberIds();
    
    if (selectedIds.length === 0) {
      alert('Please select members to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} members? This cannot be undone.`)) {
      return;
    }
    
    try {
      console.log('🗑️  Deleting members:', selectedIds);
      
      for (const id of selectedIds) {
        await db.members.delete(id);
      }
      
      alert(`✅ Successfully deleted ${selectedIds.length} members`);
      
      // Refresh the member list
      if (typeof renderMembers === 'function') {
        await renderMembers();
      }
      
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      alert('Error deleting members: ' + error.message);
    }
  }

  /**
   * Bulk send SMS to selected members
   */
  async function bulkSendSMS() {
    const selectedIds = getSelectedMemberIds();
    
    if (selectedIds.length === 0) {
      alert('Please select members to send SMS');
      return;
    }
    
    const message = prompt(`Enter SMS message to send to ${selectedIds.length} members:`);
    if (!message) return;
    
    try {
      const members = await db.members.getAll();
      const selectedMembers = members.filter(m => selectedIds.includes(m.id.toString()));
      
      let successCount = 0;
      let failCount = 0;
      
      for (const member of selectedMembers) {
        if (typeof sendSMS === 'function') {
          const result = await sendSMS(member.phone, message);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }
      }
      
      alert(`✅ SMS sent: ${successCount} successful, ${failCount} failed`);
      
    } catch (error) {
      console.error('❌ Bulk SMS error:', error);
      alert('Error sending SMS: ' + error.message);
    }
  }

  /**
   * Export filtered data
   */
  function exportFilteredMembers() {
    // Get visible rows in the table
    const visibleRows = document.querySelectorAll('#membersBody tr:not([style*="display: none"])');
    
    if (visibleRows.length === 0) {
      alert('No data to export');
      return;
    }
    
    const data = Array.from(visibleRows).map(row => {
      const cells = row.querySelectorAll('td');
      return {
        name: cells[1]?.textContent || '',
        phone: cells[2]?.textContent || '',
        email: cells[3]?.textContent || '',
        plan: cells[4]?.textContent || '',
        card_number: cells[5]?.textContent || '',
        amount: cells[6]?.textContent || '',
        payment_id: cells[7]?.textContent || '',
        added_by: cells[8]?.textContent || '',
        created_at: cells[9]?.textContent || ''
      };
    });
    
    // Convert to CSV
    const csv = toCSV(data, Object.keys(data[0]));
    downloadCSV(`svcda-members-filtered-${Date.now()}.csv`, csv);
    
    alert(`✅ Exported ${data.length} members to CSV`);
  }

  // Helper function for CSV export
  function toCSV(rows, columns) {
    const lines = [columns.join(',')];
    rows.forEach(row => {
      const line = columns.map(col => {
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

  // ==================== ADVANCED FILTERING ====================
  
  /**
   * Add advanced filter controls
   */
  function addAdvancedFilters() {
    const filterContainer = document.getElementById('advancedFilters');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = `
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
        <select id="filterPlan" style="padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
          <option value="">All Plans</option>
          <option value="Premium">Premium</option>
          <option value="Basic">Basic</option>
          <option value="Gold">Gold</option>
        </select>
        
        <select id="filterEmployee" style="padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
          <option value="">All Employees</option>
        </select>
        
        <input type="date" id="filterDateFrom" style="padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
        <input type="date" id="filterDateTo" style="padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
        
        <button onclick="applyAdvancedFilters()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Apply Filters
        </button>
        <button onclick="clearAdvancedFilters()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Clear
        </button>
      </div>
    `;
    
    // Populate employee dropdown
    populateEmployeeFilter();
  }

  async function populateEmployeeFilter() {
    try {
      const employees = await db.employees.getAll();
      const select = document.getElementById('filterEmployee');
      if (!select) return;
      
      employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.name || emp.email;
        option.textContent = emp.name || emp.email;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error populating employee filter:', error);
    }
  }

  // ==================== EXPORT TO WINDOW ====================
  
  window.renderAdvancedAnalytics = renderAdvancedAnalytics;
  window.bulkDeleteMembers = bulkDeleteMembers;
  window.bulkSendSMS = bulkSendSMS;
  window.exportFilteredMembers = exportFilteredMembers;
  window.addAdvancedFilters = addAdvancedFilters;

  console.log('✅ Advanced admin features loaded');

})();
