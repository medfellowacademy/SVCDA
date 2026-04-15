import { defineConfig } from 'vite';

export default defineConfig({
  // Root directory
  root: '.',
  
  // Public directory for static assets
  publicDir: 'assets',
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        // Pages
        about: './pages/about.html',
        admin: './pages/admin.html',
        agriculture: './pages/agriculture.html',
        ayurvedic: './pages/ayurvedic-products.html',
        business: './pages/business.html',
        contact: './pages/contact.html',
        education: './pages/education.html',
        educationProducts: './pages/education-products.html',
        electronics: './pages/electronics.html',
        employeeDashboard: './pages/employee-dashboard.html',
        employeeLogin: './pages/employee-login.html',
        employment: './pages/employment.html',
        grocery: './pages/grocery.html',
        groceryProducts: './pages/grocery-products.html',
        health: './pages/health.html',
        healthProducts: './pages/health-products.html',
        memberDashboard: './pages/member-dashboard.html',
        memberLogin: './pages/member-login.html',
        orderService: './pages/order-service.html',
        paymentSuccess: './pages/payment-success.html',
        premiumCard: './pages/premium-card.html',
        register: './pages/register.html',
        sectors: './pages/sectors.html',
        services: './pages/services.html',
        skillDevelopment: './pages/skill-development.html',
        vision: './pages/vision.html',
        womenEmpowerment: './pages/women-empowerment.html'
      }
    }
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    open: true
  },
  
  // Environment variable prefix
  envPrefix: 'VITE_',
  
  // Preview server configuration
  preview: {
    port: 4173
  }
});
