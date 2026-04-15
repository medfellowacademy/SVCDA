/**
 * Supabase Configuration for SVCDA Platform
 * 
 * Uses Vite environment variables for secure credential management.
 * Set these in Vercel dashboard or .env file:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_KEY
 */

// Load from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Validate credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Missing Supabase credentials! Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in environment variables.');
}

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
