/**
 * Supabase Configuration for GVCDA Platform
 * 
 * Uses Vite environment variables for secure credential management.
 * Set these in Vercel dashboard or .env file:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_KEY
 */

// Supabase credentials — set directly for static hosting (no Vite build)
// Also supports window.SVCDA_SUPABASE_URL / window.SVCDA_SUPABASE_KEY overrides
let SUPABASE_URL = (typeof window !== 'undefined' && window.SVCDA_SUPABASE_URL)
  ? window.SVCDA_SUPABASE_URL
  : (import.meta?.env?.VITE_SUPABASE_URL || 'https://ugpnumgppmhtnozskxdq.supabase.co');

let SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SVCDA_SUPABASE_KEY)
  ? window.SVCDA_SUPABASE_KEY
  : (import.meta?.env?.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncG51bWdwcG1odG5venNreGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzQyMDMsImV4cCI6MjA5MTgxMDIwM30.K3L88HprTX52J_xK_JmPzKCMQRCW07hhRDOHqNIxPW4');

// Initialize Supabase client
const supabase = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Helper to safely execute database operations
function safeDbOperation(operation, fallbackValue = []) {
  return async function(...args) {
    if (!supabase) {
      console.warn('Supabase not configured. Operation skipped:', operation.name);
      return fallbackValue;
    }
    try {
      return await operation(...args);
    } catch (error) {
      console.error('Database operation error:', error);
      return fallbackValue;
    }
  };
}

// Helper functions for common operations
const db = {
  // Members operations
  members: {
    async create(memberData) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getAll() {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async getByEmployee(employeeId) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('added_by', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    
    async getByPhone(phone) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone);
      
      if (error) throw error;
      return data;
    },
    
    async getByCardNumber(cardNumber) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('card_number', cardNumber)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async search(searchTerm) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    
    async update(id, updates) {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async deleteMany(ids) {
      const { error } = await supabase
        .from('members')
        .delete()
        .in('id', ids);
      if (error) throw error;
    }
  },
  
  // Employees operations
  employees: {
    async create(employeeData) {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getAll() {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async getByEmail(email) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) throw new Error('Database error: ' + error.message);
      if (!data) throw new Error('No employee found with email: ' + email);
      return data;
    },
    
    async update(id, updates) {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async updateLastLogin(id) {
      return await this.update(id, {
        last_login: new Date().toISOString()
      });
    },

    async delete(id) {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // Activity log operations
  activity: {
    async create(activityData) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('activity')
        .insert([activityData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getAll(limit = 100) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    
    async search(searchTerm) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .or(`type.ilike.%${searchTerm}%,member_name.ilike.%${searchTerm}%,service.ilike.%${searchTerm}%`)
        .order('timestamp', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('activity')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('activity')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async deleteMany(ids) {
      const { error } = await supabase
        .from('activity')
        .delete()
        .in('id', ids);
      if (error) throw error;
    }
  },
  
  // Settings operations
  settings: {
    async get(key) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data ? data.value : null;
    },
    
    async set(key, value) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('settings')
        .upsert([{ key, value }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Job Applications operations
  job_applications: {
    async create(applicationData) {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([applicationData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getAll() {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async getByStatus(status) {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async search(searchTerm) {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async update(id, updates) {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  // Payments operations
  payments: {
    async create(paymentData) {
      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getAll() {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async getByMember(memberId) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false});
      
      if (error) throw error;
      return data || [];
    },
    
    async getByPaymentId(razorpayPaymentId) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_payment_id', razorpayPaymentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async search(searchTerm) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,razorpay_payment_id.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async getFiltered(dateFilter) {
      let query = supabase
        .from('payments')
        .select('*');
      
      const now = new Date();
      
      if (dateFilter === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('created_at', todayStart);
      } else if (dateFilter === 'week') {
        const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query = query.gte('created_at', weekStart);
      } else if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('created_at', monthStart);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  }
};

// Authentication helper
const auth = {
  async login(email, password) {
    try {
      const employee = await db.employees.getByEmail(email);
      
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // Simple password check (in production, use hashed passwords)
      if (employee.password !== password) {
        throw new Error('Invalid password');
      }
      
      // Update last login
      await db.employees.updateLastLogin(employee.id);
      
      // Store in session
      sessionStorage.setItem('currentEmployee', JSON.stringify(employee));
      
      return employee;
    } catch (error) {
      throw error;
    }
  },
  
  logout() {
    sessionStorage.removeItem('currentEmployee');
    window.location.href = 'employee-login.html';
  },
  
  getCurrentEmployee() {
    const emp = sessionStorage.getItem('currentEmployee');
    return emp ? JSON.parse(emp) : null;
  },
  
  isLoggedIn() {
    return !!this.getCurrentEmployee();
  }
};

// Make available globally for inline scripts in HTML
window.supabaseClient = supabase;
window.db = db;
window.auth = auth;

// Export for ES modules
export { supabase, db, auth };

// Export for CommonJS (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabase, db, auth };
}
