/**
 * 3movieCollectors - Global Frontend Application
 * Shared utilities, API helpers, and page initialization
 */

(function () {
  "use strict";

  // ==================== GLOBAL APP OBJECT ====================

  window.App = {
    // Current user (loaded from API)
    currentUser: null,

    // API base URL
    apiBase: "/api",

    // ==================== API HELPERS ====================

    /**
     * Make an authenticated fetch request with JSON
     * @param {string} url - API endpoint URL
     * @param {object} options - Fetch options
     * @returns {Promise<object>} - JSON response
     */
    async fetchJSON(url, options = {}) {
      const defaultOptions = {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        credentials: "include", // Include cookies for session
      };

      const mergedOptions = { ...defaultOptions, ...options };

      try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Request failed: ${response.status}`);
        }

        return data;
      } catch (error) {
        console.error("API Error:", error);
        throw error;
      }
    },

    /**
     * GET request helper
     */
    async get(endpoint) {
      return this.fetchJSON(`${this.apiBase}${endpoint}`);
    },

    /**
     * POST request helper
     */
    async post(endpoint, data) {
      return this.fetchJSON(`${this.apiBase}${endpoint}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    /**
     * PATCH request helper
     */
    async patch(endpoint, data) {
      return this.fetchJSON(`${this.apiBase}${endpoint}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    /**
     * DELETE request helper
     */
    async delete(endpoint) {
      return this.fetchJSON(`${this.apiBase}${endpoint}`, {
        method: "DELETE",
      });
    },

    // ==================== AUTH HELPERS ====================

    /**
     * Check if user is authenticated
     */
    async checkAuth() {
      try {
        const data = await this.get("/auth/me");
        if (data.success && data.user) {
          this.currentUser = data.user;
          return true;
        }
        return false;
      } catch (error) {
        this.currentUser = null;
        return false;
      }
    },

    /**
     * Get current user (loads if not cached)
     */   async getCurrentUser() {
      if (!this.currentUser) {
        await this.checkAuth();
      }
      return this.currentUser;
    },

    /**
     * Logout user
     */
    async logout() {
      try {
        await this.post("/auth/logout");
        this.currentUser = null;
        window.location.href = "/index.html";
      } catch (error) {
        console.error("Logout failed:", error);
      }
    },

    /**
     * Require authentication (redirect if not logged in)
     */
    async requireAuth() {
      const isAuth = await this.checkAuth();
      if (!isAuth) {
        window.location.href = "/login.html";
        return false;
      }
      return true;
    },

    // ==================== UI HELPERS ====================

    /**
     * Show toast notification
     */
    showToast(message, type = "info", duration = 3000) {
      // Remove existing toast if any
      const existingToast = document.querySelector(".app-toast");
      if (existingToast) {
        existingToast.remove();
      }

      // Create toast element
      const toast = document.createElement("div");
      toast.className = `app-toast app-toast--${type}`;
      toast.textContent = message;

      // Toast styles
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
      `;

      // Type-specific colors
      const colors = {
        success: { bg: "#d4edda", text: "#155724", border: "#c3e6cb" },
        error: { bg: "#f8d7da", text: "#721c24", border: "#f5c6cb" },
        warning: { bg: "#fff3cd", text: "#856404", border: "#ffeaa7" },
        info: { bg: "#d1ecf1", text: "#0c5460", border: "#bee5eb" },
      };

      const color = colors[type] || colors.info;
      toast.style.backgroundColor = color.bg;
      toast.style.color = color.text;
      toast.style.border = `1px solid ${color.border}`;

      // Add animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(toast);

      // Auto-remove after duration
      setTimeout(() => {
        toast.style.animation = "slideInRight 0.3s ease-out reverse";
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    /**
     * Show error message
     */
    showError(message, duration = 5000) {
      this.showToast(message, "error", duration);
    },

    /**
     * Show success message
     */
    showSuccess(message, duration = 3000) {
      this.showToast(message, "success", duration);
    },

    /**
     * Show warning message
     */
    showWarning(message, duration = 4000) {
      this.showToast(message, "warning", duration);
    },

    /**
     * Show info message
     */
    showInfo(message, duration = 3000) {
      this.showToast(message, "info", duration);
    },

    /**
     * Show loading overlay
     */
    showLoading(message = "Loading...") {
      // Remove existing loader if any
      const existingLoader = document.querySelector(".app-loader");
      if (existingLoader) {
        existingLoader.remove();
      }

      const loader = document.createElement("div");
      loader.className = "app-loader";
      loader.innerHTML = `
        <div class="app-loader__content">
          <div class="app-loader__spinner"></div>
          <div class="app-loader__text">${message}</div>
        </div>
      `;

      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const content = loader.querySelector(".app-loader__content");
      content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
      `;

      const spinner = loader.querySelector(".app-loader__spinner");
      spinner.style.cssText = `
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
      `;

      const style = document.createElement("style");
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(loader);
      return loader;
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
      const loader = document.querySelector(".app-loader");
      if (loader) {
        loader.remove();
      }
    },

    /**
     * Format date to readable string
     */
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    /**
     * Format date with time
     */
    formatDateTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    /**
     * Debounce function
     */
    debounce(func, wait = 300) {
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

    // ==================== PAGE INITIALIZATION ====================

    /**
     * Initialize page-specific functionality
     */
    async init() {
      // Get page name from body data attribute or URL
      const page =
        document.body.dataset.page ||
        window.location.pathname.split("/").pop().replace(".html", "");

      console.log(`[App] Initializing page: ${page}`);

      // Call page-specific initializer if it exists
      if (window.initPage && typeof window.initPage[page] === "function") {
        try {
          await window.initPage[page]();
        } catch (error) {
          console.error(`[App] Error initializing ${page}:`, error);
        }
      }
    },
  };

  // ==================== AUTO-INITIALIZE ====================

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      App.init();
    });
  } else {
    App.init();
  }

  console.log("[App] Global application loaded");
})();
