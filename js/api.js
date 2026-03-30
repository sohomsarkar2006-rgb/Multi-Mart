window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.API_BASE_URL =
  window.APP_CONFIG.API_BASE_URL || "http://localhost:5000/api";

window.MultiMartAPI = {
  tokenKey: "api_token",

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
  },

  clearToken() {
    localStorage.removeItem(this.tokenKey);
  },

  async request(path, options = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      options.headers || {}
    );

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs || 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(`${window.APP_CONFIG.API_BASE_URL}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error?.name === "AbortError") {
        throw new Error(
          `Backend API timed out after ${Math.round(timeoutMs / 1000)} seconds. Make sure the server is running and responding on http://localhost:5000.`
        );
      }
      if (String(error?.message || "") === "Failed to fetch") {
        throw new Error(
          "Cannot reach backend API. Make sure the backend server is running on http://localhost:5000 and local CORS is allowed."
        );
      }
      throw error;
    }
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  },

  async login(payload) {
    return this.request("/auth/login", {
      method: "POST",
      body: payload
    });
  },

  async register(payload) {
    return this.request("/auth/register", {
      method: "POST",
      body: payload
    });
  },

  async getProducts() {
    return this.request("/products");
  },

  async getVendorDashboard() {
    return this.request("/dashboard/vendor");
  },

  async getVendorPayouts() {
    return this.request("/dashboard/vendor/payouts");
  },

  async requestVendorPayout() {
    return this.request("/dashboard/vendor/payouts/request", {
      method: "POST"
    });
  },

  async getAdminDashboard() {
    return this.request("/dashboard/admin");
  },

  async getAdminPayouts() {
    return this.request("/dashboard/admin/payouts");
  },

  async updateAdminPayoutStatus(payoutId, status) {
    return this.request(`/dashboard/admin/payouts/${payoutId}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  async getVendorProducts() {
    return this.request("/products/vendor");
  },

  async createVendorProduct(payload) {
    return this.request("/products", {
      method: "POST",
      body: payload
    });
  },

  async getVendorOrders() {
    return this.request("/orders/vendor");
  },

  async getPendingProducts() {
    return this.request("/admin/products/pending");
  },

  async getAdminVendors() {
    return this.request("/admin/vendors");
  },

  async updateAdminVendorStatus(vendorId, status) {
    return this.request(`/admin/vendors/${vendorId}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  async getAdminProducts() {
    return this.request("/admin/products");
  },

  async getAdminUsers() {
    return this.request("/admin/users");
  },

  async getAdminOrders() {
    return this.request("/admin/orders");
  },

  async getAdminComplaints() {
    return this.request("/admin/complaints");
  },

  async updateAdminComplaintStatus(complaintId, status) {
    return this.request(`/admin/complaints/${complaintId}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  async getAdminAnalytics() {
    return this.request("/admin/analytics");
  },

  async getAdminSettings() {
    return this.request("/admin/settings");
  },

  async updateAdminSettings(payload) {
    return this.request("/admin/settings", {
      method: "PATCH",
      body: payload
    });
  },

  async updateAdminProductStatus(productId, status) {
    return this.request(`/admin/products/${productId}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  async createOrder(payload) {
    return this.request("/orders", {
      method: "POST",
      body: payload
    });
  },

  async updateAdminUserStatus(userId, status) {
    return this.request(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  async getPublicSettings() {
    return this.request("/public/settings/public");
  },

  async getContactInfo() {
    return this.request("/public/settings/contact");
  }
};
