/**
 * SVCDA Platform - UI Enhancements Library
 * Toast notifications, form validation, and loading states
 */

(function() {
  'use strict';

  // ==================== TOAST NOTIFICATIONS ====================
  
  const Toast = {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'info', duration = 4000) {
      this.init();

      const toast = document.createElement('div');
      toast.className = `toast toast-${type} animate-slideDown`;
      
      const icon = this.getIcon(type);
      
      toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>
      `;

      this.container.appendChild(toast);

      // Close button
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.remove(toast));

      // Auto remove
      if (duration > 0) {
        setTimeout(() => this.remove(toast), duration);
      }

      return toast;
    },

    remove(toast) {
      toast.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    },

    getIcon(type) {
      const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
      };
      return icons[type] || icons.info;
    },

    success(message, duration) {
      return this.show(message, 'success', duration);
    },

    error(message, duration) {
      return this.show(message, 'error', duration);
    },

    warning(message, duration) {
      return this.show(message, 'warning', duration);
    },

    info(message, duration) {
      return this.show(message, 'info', duration);
    }
  };

  // ==================== FORM VALIDATION ====================
  
  const FormValidator = {
    validators: {
      required: (value) => value.trim() !== '',
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      phone: (value) => /^[6-9]\d{9}$/.test(value.replace(/\s+/g, '')),
      minLength: (value, min) => value.length >= min,
      maxLength: (value, max) => value.length <= max,
      pattern: (value, regex) => new RegExp(regex).test(value),
      number: (value) => !isNaN(value) && value.trim() !== '',
      url: (value) => /^https?:\/\/.+/.test(value),
      match: (value, matchValue) => value === matchValue
    },

    messages: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid 10-digit mobile number',
      minLength: 'Minimum {min} characters required',
      maxLength: 'Maximum {max} characters allowed',
      pattern: 'Invalid format',
      number: 'Please enter a valid number',
      url: 'Please enter a valid URL',
      match: 'Fields do not match'
    },

    validate(input, rules) {
      const value = input.value;
      const errors = [];

      for (const [rule, param] of Object.entries(rules)) {
        if (rule === 'required' && !this.validators.required(value)) {
          errors.push(this.messages.required);
          break;
        } else if (rule !== 'required' && value.trim() !== '') {
          if (param !== true && param !== undefined) {
            if (!this.validators[rule](value, param)) {
              errors.push(this.messages[rule].replace(`{${rule}}`, param));
            }
          } else {
            if (!this.validators[rule](value)) {
              errors.push(this.messages[rule]);
            }
          }
        }
      }

      return errors;
    },

    showError(input, message) {
      this.clearError(input);
      
      input.classList.add('input-error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      
      input.parentNode.appendChild(errorDiv);
      input.setAttribute('aria-invalid', 'true');
    },

    clearError(input) {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
      
      const errorDiv = input.parentNode.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.remove();
      }
    },

    validateForm(form, rules) {
      let isValid = true;

      for (const [name, fieldRules] of Object.entries(rules)) {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) continue;

        const errors = this.validate(input, fieldRules);
        
        if (errors.length > 0) {
          this.showError(input, errors[0]);
          isValid = false;
        } else {
          this.clearError(input);
        }
      }

      return isValid;
    },

    init(form, rules, onSubmit) {
      // Real-time validation
      for (const name of Object.keys(rules)) {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) continue;

        input.addEventListener('blur', () => {
          const errors = this.validate(input, rules[name]);
          if (errors.length > 0) {
            this.showError(input, errors[0]);
          } else {
            this.clearError(input);
          }
        });

        input.addEventListener('input', () => {
          if (input.classList.contains('input-error')) {
            const errors = this.validate(input, rules[name]);
            if (errors.length === 0) {
              this.clearError(input);
            }
          }
        });
      }

      // Form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (this.validateForm(form, rules)) {
          if (typeof onSubmit === 'function') {
            onSubmit(new FormData(form));
          }
        } else {
          Toast.error('Please fix the errors in the form');
          
          // Focus first error
          const firstError = form.querySelector('.input-error');
          if (firstError) {
            firstError.focus();
          }
        }
      });
    }
  };

  // ==================== LOADING STATES ====================
  
  const Loading = {
    show(element, text = 'Loading...') {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      
      if (!element) return;

      element.classList.add('loading');
      element.setAttribute('disabled', 'true');
      
      const originalHTML = element.innerHTML;
      element.setAttribute('data-original-html', originalHTML);
      
      element.innerHTML = `
        <span class="spinner spinner-sm"></span>
        <span style="margin-left: 8px;">${text}</span>
      `;
    },

    hide(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      
      if (!element) return;

      element.classList.remove('loading');
      element.removeAttribute('disabled');
      
      const originalHTML = element.getAttribute('data-original-html');
      if (originalHTML) {
        element.innerHTML = originalHTML;
        element.removeAttribute('data-original-html');
      }
    },

    overlay(show = true, text = 'Loading...') {
      let overlay = document.getElementById('loading-overlay');
      
      if (show) {
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'loading-overlay';
          overlay.className = 'loading-overlay';
          overlay.innerHTML = `
            <div class="loading-content">
              <div class="spinner spinner-lg"></div>
              <div class="loading-text">${text}</div>
            </div>
          `;
          document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
      } else {
        if (overlay) {
          overlay.style.display = 'none';
        }
      }
    }
  };

  // ==================== SCROLL REVEAL ====================
  
  const ScrollReveal = {
    elements: [],

    init(selector = '.scroll-reveal') {
      this.elements = document.querySelectorAll(selector);
      
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });

        this.elements.forEach(el => observer.observe(el));
      } else {
        // Fallback for older browsers
        this.elements.forEach(el => el.classList.add('revealed'));
      }
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  
  const Utils = {
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    formatCurrency(amount) {
      return '₹' + parseFloat(amount).toLocaleString('en-IN');
    },

    formatPhone(phone) {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
      }
      return phone;
    },

    copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          Toast.success('Copied to clipboard!');
        }).catch(() => {
          Toast.error('Failed to copy');
        });
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          Toast.success('Copied to clipboard!');
        } catch (err) {
          Toast.error('Failed to copy');
        }
        document.body.removeChild(textarea);
      }
    }
  };

  // ==================== EXPORT TO WINDOW ====================
  
  window.Toast = Toast;
  window.FormValidator = FormValidator;
  window.Loading = Loading;
  window.ScrollReveal = ScrollReveal;
  window.Utils = Utils;

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ScrollReveal.init();
    });
  } else {
    ScrollReveal.init();
  }

  console.log('✅ UI Enhancements loaded - Toast, FormValidator, Loading, ScrollReveal, Utils');

})();
