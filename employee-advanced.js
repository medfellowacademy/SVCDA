/**
 * Advanced Employee Dashboard Features
 * SVCDA Platform - Enhanced Employee Experience
 * 
 * Features:
 * - Performance metrics and leaderboard
 * - Activity timeline
 * - Quick actions
 * - Personal analytics
 * - Commission calculator
 * - Member history
 */

(function() {
  'use strict';

  // ==================== PERFORMANCE METRICS ====================
  
  /**
   * Calculate and display employee performance metrics
   */
  async function renderEmployeeMetrics(employeeId) {
    try {
      const members = await db.members.getAll();
      const myMembers = members.filter(m => m.added_by === employeeId);
      
      // Calculate metrics
      const metrics = {
        totalMembers: myMembers.length,
        premiumMembers: myMembers.filter(m => m.plan && m.plan.toLowerCase().includes('premium')).length,
        thisMonth: calculateThisMonthMembers(myMembers),
        thisWeek: calculateThisWeekMembers(myMembers),
        totalRevenue: myMembers.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0),
        avgDeal: myMembers.length > 0 ? myMembers.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) / myMembers.length : 0
      };
      
      // Update UI
      updateMetricsDisplay(metrics);
      
      // Create mini charts
      renderWeeklyTrendChart(myMembers);
      renderPlanBreakdownChart(myMembers);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Error rendering metrics:', error);
      return null;
    }
  }

  function calculateThisMonthMembers(members) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return members.filter(m => {
      if (!m.created_at) return false;
      const mDate = new Date(m.created_at);
      return mDate.getMonth() === thisMonth && mDate.getFullYear() === thisYear;
    }).length;
  }

  function calculateThisWeekMembers(members) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return members.filter(m => {
      if (!m.created_at) return false;
      const mDate = new Date(m.created_at);
      return mDate >= weekAgo;
    }).length;
  }

  function updateMetricsDisplay(metrics) {
    const elements = {
      totalMembers: document.getElementById('totalMembersMetric'),
      premiumMembers: document.getElementById('premiumMembersMetric'),
      thisMonth: document.getElementById('thisMonthMetric'),
      thisWeek: document.getElementById('thisWeekMetric'),
      totalRevenue: document.getElementById('totalRevenueMetric'),
      avgDeal: document.getElementById('avgDealMetric')
    };
    
    if (elements.totalMembers) elements.totalMembers.textContent = metrics.totalMembers;
    if (elements.premiumMembers) elements.premiumMembers.textContent = metrics.premiumMembers;
    if (elements.thisMonth) elements.thisMonth.textContent = metrics.thisMonth;
    if (elements.thisWeek) elements.thisWeek.textContent = metrics.thisWeek;
    if (elements.totalRevenue) elements.totalRevenue.textContent = `₹${metrics.totalRevenue.toLocaleString('en-IN')}`;
    if (elements.avgDeal) elements.avgDeal.textContent = `₹${Math.round(metrics.avgDeal).toLocaleString('en-IN')}`;
  }

  // ==================== ACTIVITY TIMELINE ====================
  
  /**
   * Render employee activity timeline
   */
  async function renderActivityTimeline(employeeId) {
    try {
      const activity = await db.activity.getAll();
      const myActivity = activity
        .filter(a => a.added_by === employeeId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20); // Last 20 activities
      
      const container = document.getElementById('activityTimeline');
      if (!container) return;
      
      if (myActivity.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No activity yet</p>';
        return;
      }
      
      let html = '<div style="position: relative; padding-left: 30px;">';
      
      // Timeline line
      html += '<div style="position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: #e0e0e0;"></div>';
      
      myActivity.forEach((act, index) => {
        const time = formatTimeAgo(act.created_at);
        const icon = getActivityIcon(act.type);
        const color = getActivityColor(act.type);
        
        html += `
          <div style="position: relative; margin-bottom: 20px;">
            <div style="position: absolute; left: -26px; width: 16px; height: 16px; background: ${color}; 
                        border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <strong style="color: #333; font-size: 14px;">${icon} ${act.type}</strong>
                <span style="color: #999; font-size: 12px;">${time}</span>
              </div>
              <div style="color: #666; font-size: 13px;">
                <strong>${act.member_name}</strong> • ${act.phone || ''}<br>
                ${act.service ? `Service: ${act.service}` : ''}
                ${act.payment ? ` • Payment: ${act.payment}` : ''}
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
      
    } catch (error) {
      console.error('❌ Error rendering timeline:', error);
    }
  }

  function getActivityIcon(type) {
    const icons = {
      'Premium Registration': '💎',
      'Service Request': '🛠️',
      'Member Added': '👤',
      'Payment': '💳'
    };
    return icons[type] || '📝';
  }

  function getActivityColor(type) {
    const colors = {
      'Premium Registration': '#667eea',
      'Service Request': '#764ba2',
      'Member Added': '#4facfe',
      'Payment': '#00f2fe'
    };
    return colors[type] || '#999';
  }

  function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-IN');
  }

  // ==================== LEADERBOARD ====================
  
  /**
   * Display employee leaderboard
   */
  async function renderLeaderboard() {
    try {
      const employees = await db.employees.getAll();
      const members = await db.members.getAll();
      
      // Calculate stats for each employee
      const leaderboardData = employees.map(emp => {
        const empMembers = members.filter(m => m.added_by === emp.id);
        return {
          id: emp.id,
          name: emp.name || emp.email,
          totalMembers: empMembers.length,
          premiumMembers: empMembers.filter(m => m.plan && m.plan.toLowerCase().includes('premium')).length,
          revenue: empMembers.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
        };
      }).sort((a, b) => b.totalMembers - a.totalMembers);
      
      const container = document.getElementById('leaderboardContainer');
      if (!container) return;
      
      if (leaderboardData.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No employees yet</p>';
        return;
      }
      
      let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
      
      leaderboardData.forEach((emp, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const highlight = index < 3 ? 'background: linear-gradient(135deg, #fff5e6 0%, #ffe9cc 100%);' : '';
        
        html += `
          <div style="padding: 15px; border-radius: 8px; ${highlight} border: 1px solid #e0e0e0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 16px;">${medal} ${emp.name}</strong>
                <div style="color: #666; font-size: 13px; margin-top: 4px;">
                  ${emp.totalMembers} members • ${emp.premiumMembers} premium • ₹${emp.revenue.toLocaleString('en-IN')}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 24px; font-weight: 700; color: #667eea;">#${index + 1}</div>
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
      
    } catch (error) {
      console.error('❌ Error rendering leaderboard:', error);
    }
  }

  // ==================== QUICK ACTIONS ====================
  
  /**
   * Quick action: Duplicate last member
   */
  async function duplicateLastMember(employeeId) {
    try {
      const members = await db.members.getAll();
      const myMembers = members
        .filter(m => m.added_by === employeeId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (myMembers.length === 0) {
        alert('No previous members to duplicate');
        return;
      }
      
      const lastMember = myMembers[0];
      
      // Pre-fill form with last member's data (except name and phone)
      const form = document.getElementById('addUserForm');
      if (form) {
        form.querySelector('#userEmail').value = '';
        form.querySelector('#userDistrict').value = lastMember.district || '';
        form.querySelector('#userCity').value = lastMember.city || '';
        form.querySelector('#userAmount').value = lastMember.amount || 1499;
        
        alert('✅ Form pre-filled with last member data. Enter new name and phone.');
        
        // Switch to add tab
        if (typeof switchTab === 'function') {
          switchTab('add');
        }
      }
      
    } catch (error) {
      console.error('❌ Error duplicating member:', error);
      alert('Error: ' + error.message);
    }
  }

  /**
   * Quick action: Send WhatsApp to member
   */
  function quickWhatsAppMember(phone, name) {
    const message = `Hello ${name}, Thank you for joining SVCDA! 🎉`;
    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // ==================== COMMISSION CALCULATOR ====================
  
  /**
   * Calculate commission based on members added
   */
  function calculateCommission(totalMembers, totalRevenue) {
    // Example commission structure:
    // ₹50 per member for first 10
    // ₹75 per member for 11-25
    // ₹100 per member for 26+
    
    let commission = 0;
    
    if (totalMembers <= 10) {
      commission = totalMembers * 50;
    } else if (totalMembers <= 25) {
      commission = (10 * 50) + ((totalMembers - 10) * 75);
    } else {
      commission = (10 * 50) + (15 * 75) + ((totalMembers - 25) * 100);
    }
    
    return commission;
  }

  function displayCommission(totalMembers, totalRevenue) {
    const commission = calculateCommission(totalMembers, totalRevenue);
    const container = document.getElementById('commissionDisplay');
    
    if (!container) return;
    
    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px;">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Estimated Commission</div>
        <div style="font-size: 32px; font-weight: 700;">₹${commission.toLocaleString('en-IN')}</div>
        <div style="font-size: 13px; opacity: 0.8; margin-top: 8px;">
          Based on ${totalMembers} members • Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
        </div>
      </div>
    `;
  }

  // ==================== CHARTS ====================
  
  function renderWeeklyTrendChart(members) {
    const container = document.getElementById('weeklyTrendChart');
    if (!container) return;
    
    // Last 7 days
    const days = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('en-IN', { weekday: 'short' });
      
      const count = members.filter(m => {
        if (!m.created_at) return false;
        return m.created_at.split('T')[0] === dateStr;
      }).length;
      
      days.push(dayLabel);
      counts.push(count);
    }
    
    // Simple bar chart
    const maxCount = Math.max(...counts, 1);
    let html = '<div style="display: flex; align-items: flex-end; gap: 8px; height: 100px; padding: 10px;">';
    
    counts.forEach((count, index) => {
      const height = (count / maxCount) * 80;
      html += `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 100%; background: #667eea; height: ${height}px; border-radius: 4px;"></div>
          <span style="font-size: 11px; color: #666; margin-top: 4px;">${days[index]}</span>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function renderPlanBreakdownChart(members) {
    const container = document.getElementById('planBreakdownChart');
    if (!container) return;
    
    const plans = {};
    members.forEach(m => {
      const plan = m.plan || 'Unknown';
      plans[plan] = (plans[plan] || 0) + 1;
    });
    
    const total = Object.values(plans).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;">No data</p>';
      return;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    
    Object.entries(plans).forEach(([plan, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
            <span>${plan}</span>
            <span style="font-weight: 600;">${count} (${percentage}%)</span>
          </div>
          <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #667eea; width: ${percentage}%; height: 100%;"></div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // ==================== EXPORT TO WINDOW ====================
  
  window.renderEmployeeMetrics = renderEmployeeMetrics;
  window.renderActivityTimeline = renderActivityTimeline;
  window.renderLeaderboard = renderLeaderboard;
  window.duplicateLastMember = duplicateLastMember;
  window.quickWhatsAppMember = quickWhatsAppMember;
  window.displayCommission = displayCommission;

  console.log('✅ Advanced employee features loaded');

})();
