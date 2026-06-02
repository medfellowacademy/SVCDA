/**
 * Supabase Configuration for GVCDA Platform
 * 
 * Uses Vite environment variables for secure credential management.
 * Set these in Vercel dashboard or .env file:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_KEY
 */

// Load from environment variables
const SUPABASE_URL     = import.meta?.env?.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON_KEY = import.meta?.env?.VITE_SUPABASE_KEY || '';

// Initialize Supabase client — null when credentials are missing so all db guards work correctly
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase not configured — all data stored in localStorage. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env to enable cloud sync.');
}

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
      const m = Object.assign({ id: 'M_' + Date.now(), created_at: new Date().toISOString() }, memberData);
      // Always persist to localStorage
      try {
        const list = JSON.parse(localStorage.getItem('gvcda_members') || '[]');
        list.unshift(m);
        localStorage.setItem('gvcda_members', JSON.stringify(list));
      } catch(e) {}
      if (!supabase) return m;
      try {
        // Explicitly map only columns that exist in the Supabase schema
        const row = {
          name:           memberData.name,
          phone:          memberData.phone,
          email:          memberData.email          || null,
          location:       memberData.location       || null,
          plan:           memberData.plan           || 'Basic',
          card_number:    memberData.card_number    || null,
          amount:         memberData.amount         || null,
          payment_id:     memberData.payment_id     || null,
          payment_method: memberData.payment_method || null,
          notes:          memberData.notes          || null,
          added_by_name:  memberData.added_by_name  || null,
          status:         memberData.status         || 'Active'
        };
        // Only include added_by if it looks like a valid UUID (Supabase-generated)
        if (memberData.added_by && /^[0-9a-f-]{36}$/i.test(memberData.added_by)) {
          row.added_by = memberData.added_by;
        }
        const { data, error } = await supabase.from('members').insert([row]).select().single();
        if (error) {
          console.error('⚠️ Supabase members insert failed:', error.message, '| Code:', error.code);
          console.info('Tip: Run the migration SQL in supabase-migration.sql to add missing columns.');
        }
        if (!error && data) {
          // Update localStorage entry with the real Supabase id
          try {
            const list = JSON.parse(localStorage.getItem('gvcda_members') || '[]');
            const idx  = list.findIndex(x => x.id === m.id);
            if (idx !== -1) { list[idx] = Object.assign({}, list[idx], { id: data.id }); localStorage.setItem('gvcda_members', JSON.stringify(list)); }
          } catch(e) {}
          return data;
        }
      } catch(e) {
        console.error('⚠️ Supabase members create exception:', e);
      }
      return m;
    },
    
    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      try { return JSON.parse(localStorage.getItem('gvcda_members') || '[]'); } catch(e) { return []; }
    },
    
    async getByEmployee(employeeId) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('members').select('*').eq('added_by', employeeId).order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      try {
        return JSON.parse(localStorage.getItem('gvcda_members') || '[]').filter(m => m.added_by === employeeId);
      } catch(e) { return []; }
    },

    async getByPhone(phone) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('members').select('*').eq('phone', phone);
          if (!error) return data || [];
        } catch(e) {}
      }
      try {
        return JSON.parse(localStorage.getItem('gvcda_members') || '[]').filter(m => m.phone === phone);
      } catch(e) { return []; }
    },

    async getByCardNumber(cardNumber) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('members').select('*').eq('card_number', cardNumber).single();
          if (!error && data) return data;
        } catch(e) {}
      }
      try {
        return JSON.parse(localStorage.getItem('gvcda_members') || '[]').find(m => m.card_number === cardNumber) || null;
      } catch(e) { return null; }
    },

    async search(searchTerm) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('members').select('*').or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`).order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      try {
        const q = searchTerm.toLowerCase();
        return JSON.parse(localStorage.getItem('gvcda_members') || '[]').filter(m =>
          (m.name || '').toLowerCase().includes(q) || (m.phone || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
        );
      } catch(e) { return []; }
    },

    async update(id, updates) {
      try {
        const list = JSON.parse(localStorage.getItem('gvcda_members') || '[]');
        const idx  = list.findIndex(m => m.id === id);
        if (idx !== -1) { list[idx] = Object.assign({}, list[idx], updates); localStorage.setItem('gvcda_members', JSON.stringify(list)); }
      } catch(e) {}
      if (!supabase) return null;
      try {
        const { data, error } = await supabase.from('members').update(updates).eq('id', id).select().single();
        if (!error && data) return data;
      } catch(e) {}
      return null;
    },

    async delete(id) {
      try {
        const list = JSON.parse(localStorage.getItem('gvcda_members') || '[]').filter(m => m.id !== id);
        localStorage.setItem('gvcda_members', JSON.stringify(list));
      } catch(e) {}
      if (supabase) {
        try { await supabase.from('members').delete().eq('id', id); } catch(e) {}
      }
    }
  },
  
  // Employees operations
  employees: {
    _localKey: 'gvcda_employees',
    _readLocal() {
      try { return JSON.parse(localStorage.getItem('gvcda_employees') || '[]'); } catch(e) { return []; }
    },
    _writeLocal(list) {
      try { localStorage.setItem('gvcda_employees', JSON.stringify(list)); } catch(e) {}
    },

    async create(employeeData) {
      const emp = Object.assign({ id: 'EMP_' + Date.now(), created_at: new Date().toISOString() }, employeeData);
      // Always persist to localStorage
      const list = this._readLocal();
      list.unshift(emp);
      this._writeLocal(list);
      // Sync to Supabase when available
      if (supabase) {
        try {
          const { data, error } = await supabase.from('employees').insert([employeeData]).select().single();
          if (!error && data) return data;
        } catch(e) {}
      }
      return emp;
    },

    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      return this._readLocal();
    },

    async getByEmail(email) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('employees').select('*').eq('email', email).single();
          if (!error && data) return data;
        } catch(e) {}
      }
      return this._readLocal().find(e => e.email === email) || null;
    },

    async update(id, updates) {
      // Update localStorage copy
      const list = this._readLocal();
      const idx  = list.findIndex(e => e.id === id);
      if (idx !== -1) { list[idx] = Object.assign({}, list[idx], updates); this._writeLocal(list); }
      if (supabase) {
        try {
          const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select().single();
          if (!error && data) return data;
        } catch(e) {}
      }
      return idx !== -1 ? list[idx] : null;
    },

    async delete(id) {
      const list = this._readLocal().filter(e => e.id !== id);
      this._writeLocal(list);
      if (supabase) {
        try { await supabase.from('employees').delete().eq('id', id); } catch(e) {}
      }
    },

    async updateLastLogin(id) {
      return await this.update(id, { last_login: new Date().toISOString() });
    }
  },
  
  // Activity log operations
  activity: {
    async create(activityData) {
      const entry = Object.assign({ id: 'A_' + Date.now(), timestamp: new Date().toISOString() }, activityData);
      try {
        const list = JSON.parse(localStorage.getItem('gvcda_activity') || '[]');
        list.unshift(entry);
        if (list.length > 1000) list.length = 1000;
        localStorage.setItem('gvcda_activity', JSON.stringify(list));
      } catch(e) {}
      if (!supabase) return entry;
      try {
        // Map only columns that exist in the activity table schema
        const row = {
          type:           activityData.type,
          member_name:    activityData.member_name    || null,
          phone:          activityData.phone           || null,
          service:        activityData.service         || null,
          payment:        activityData.payment         || null,
          added_by_name:  activityData.added_by_name  || null,
          timestamp:      activityData.timestamp       || new Date().toISOString()
        };
        // Only include UUID FKs if they are valid Supabase UUIDs
        if (activityData.added_by  && /^[0-9a-f-]{36}$/i.test(activityData.added_by))  row.added_by  = activityData.added_by;
        if (activityData.member_id && /^[0-9a-f-]{36}$/i.test(activityData.member_id)) row.member_id = activityData.member_id;
        const { data, error } = await supabase.from('activity').insert([row]).select().single();
        if (error) console.error('⚠️ Supabase activity insert failed:', error.message);
        if (!error && data) return data;
      } catch(e) {
        console.error('⚠️ Supabase activity create exception:', e);
      }
      return entry;
    },
    
    async getAll(limit = 100) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('activity').select('*').order('timestamp', { ascending: false }).limit(limit);
          if (!error) return data || [];
        } catch(e) {}
      }
      try {
        const list = JSON.parse(localStorage.getItem('gvcda_activity') || '[]');
        return list.slice(0, limit);
      } catch(e) { return []; }
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
    _readLocal() {
      try { return JSON.parse(localStorage.getItem('gvcda_job_applications') || '[]'); } catch(e) { return []; }
    },
    _writeLocal(list) {
      try { localStorage.setItem('gvcda_job_applications', JSON.stringify(list)); } catch(e) {}
    },

    async create(applicationData) {
      const app = Object.assign({ id: 'JA_' + Date.now(), created_at: new Date().toISOString() }, applicationData);
      // Always save to localStorage first
      const list = this._readLocal();
      list.unshift(app);
      this._writeLocal(list);
      if (supabase) {
        try {
          // Send only schema-valid fields — no local id (Supabase auto-generates UUID)
          const row = {
            name:          applicationData.name,
            phone:         applicationData.phone,
            email:         applicationData.email         || null,
            age:           applicationData.age           || null,
            qualification: applicationData.qualification || null,
            experience:    applicationData.experience    || null,
            position:      applicationData.position,
            district:      applicationData.district,
            address:       applicationData.address       || null,
            skills:        applicationData.skills        || null,
            message:       applicationData.message       || null,
            status:        applicationData.status        || 'pending'
          };
          const { data, error } = await supabase.from('job_applications').insert([row]).select().single();
          if (error) {
            console.error('⚠️ Supabase job_applications insert failed:', error.message, '| Code:', error.code);
          }
          if (!error && data) {
            // Update the localStorage entry with the real Supabase id so admin dedup works
            try {
              const updated = this._readLocal();
              const idx = updated.findIndex(a => a.id === app.id);
              if (idx !== -1) { updated[idx] = Object.assign({}, updated[idx], { id: data.id }); this._writeLocal(updated); }
            } catch(e) {}
            return data;
          }
        } catch(e) {
          console.error('⚠️ Supabase job_applications create exception:', e);
        }
      }
      return app;
    },

    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('job_applications').select('*').order('created_at', { ascending: false });
          if (!error) {
            // Merge any local-only entries (submitted while offline) into the Supabase result
            const localList  = this._readLocal();
            const remoteIds  = new Set(data.map(a => a.id));
            const localOnly  = localList.filter(a => !remoteIds.has(a.id));
            return [...data, ...localOnly].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }
        } catch(e) {}
      }
      return this._readLocal();
    },

    async getByStatus(status) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('job_applications').select('*').eq('status', status).order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      return this._readLocal().filter(a => a.status === status);
    },

    async search(searchTerm) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('job_applications').select('*').or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%`).order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      const q = searchTerm.toLowerCase();
      return this._readLocal().filter(a =>
        (a.name||'').toLowerCase().includes(q)||(a.phone||'').toLowerCase().includes(q)||(a.email||'').toLowerCase().includes(q)||(a.position||'').toLowerCase().includes(q)
      );
    },

    async update(id, updates) {
      const list = this._readLocal();
      const idx  = list.findIndex(a => a.id === id);
      if (idx !== -1) { list[idx] = Object.assign({}, list[idx], updates, { updated_at: new Date().toISOString() }); this._writeLocal(list); }
      if (supabase) {
        try {
          const { data, error } = await supabase.from('job_applications').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
          if (!error && data) return data;
        } catch(e) {}
      }
      return idx !== -1 ? list[idx] : null;
    },

    async delete(id) {
      this._writeLocal(this._readLocal().filter(a => a.id !== id));
      if (supabase) {
        try { await supabase.from('job_applications').delete().eq('id', id); } catch(e) {}
      }
    }
  },

  // Payments operations
  payments: {
    async create(paymentData) {
      const p = Object.assign({ id: 'PAY_' + Date.now(), created_at: new Date().toISOString() }, paymentData);
      try {
        const list = JSON.parse(localStorage.getItem('gvcda_payments') || '[]');
        list.unshift(p);
        localStorage.setItem('gvcda_payments', JSON.stringify(list));
      } catch(e) {}
      if (!supabase) return p;
      try {
        const { data, error } = await supabase.from('payments').insert([paymentData]).select().single();
        if (!error && data) return data;
      } catch(e) {}
      return p;
    },

    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      try { return JSON.parse(localStorage.getItem('gvcda_payments') || '[]'); } catch(e) { return []; }
    },

    async getByMember(memberId) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('payments').select('*').eq('member_id', memberId).order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      try { return JSON.parse(localStorage.getItem('gvcda_payments') || '[]').filter(p => p.member_id === memberId); } catch(e) { return []; }
    },

    async getByPaymentId(razorpayPaymentId) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('payments').select('*').eq('razorpay_payment_id', razorpayPaymentId).single();
          if (!error && data) return data;
        } catch(e) {}
      }
      try { return JSON.parse(localStorage.getItem('gvcda_payments') || '[]').find(p => p.razorpay_payment_id === razorpayPaymentId) || null; } catch(e) { return null; }
    },

    async search(searchTerm) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('payments').select('*').or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,razorpay_payment_id.ilike.%${searchTerm}%`).order('created_at', { ascending: false });
          if (!error) return data || [];
        } catch(e) {}
      }
      try {
        const q = searchTerm.toLowerCase();
        return JSON.parse(localStorage.getItem('gvcda_payments') || '[]').filter(p =>
          (p.name||'').toLowerCase().includes(q)||(p.phone||'').toLowerCase().includes(q)||(p.razorpay_payment_id||'').toLowerCase().includes(q)
        );
      } catch(e) { return []; }
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
    const employee = await db.employees.getByEmail(email);
    if (!employee) throw new Error('Employee not found. Ask admin to add your account.');
    if (employee.password !== password) throw new Error('Invalid password.');
    try { await db.employees.updateLastLogin(employee.id); } catch(e) {}
    sessionStorage.setItem('currentEmployee', JSON.stringify(employee));
    return employee;
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
