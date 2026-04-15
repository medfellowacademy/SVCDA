/**
 * Supabase Configuration for SVCDA Platform
 * 
 * Setup Instructions:
 * 1. Go to https://supabase.com and create a free account
 * 2. Create a new project (name: svcda-platform)
 * 3. Wait 2-3 minutes for project to initialize
 * 4. Go to Settings > API
 * 5. Copy your Project URL and anon/public key
 * 6. Replace the values below
 */

// ✅ SUPABASE CREDENTIALS CONFIGURED
const SUPABASE_URL = 'https://ugpnumgppmhtnozskxdq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncG51bWdwcG1odG5venNreGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzQyMDMsImV4cCI6MjA5MTgxMDIwM30.K3L88HprTX52J_xK_JmPzKCMQRCW07hhRDOHqNIxPW4';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper functions for common operations
const db = {
  // Members operations
  members: {
    async create(memberData) {
      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getAll() {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    
    async getByEmail(email) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
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
    }
  },
  
  // Activity log operations
  activity: {
    async create(activityData) {
      const { data, error } = await supabase
        .from('activity')
        .insert([activityData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async getAll(limit = 100) {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    
    async search(searchTerm) {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .or(`type.ilike.%${searchTerm}%,member_name.ilike.%${searchTerm}%,service.ilike.%${searchTerm}%`)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  },
  
  // Settings operations
  settings: {
    async get(key) {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data ? data.value : null;
    },
    
    async set(key, value) {
      const { data, error } = await supabase
        .from('settings')
        .upsert([{ key, value }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabase, db, auth };
}
