/**
 * MARIFAH - Admin Shared Utilities
 * Auth, fetch wrapper, modals, toasts
 */

const Admin = {
  // ==========================================
  // AUTH
  // ==========================================
  getToken() {
    return sessionStorage.getItem('marifah-admin-token');
  },

  setToken(token) {
    sessionStorage.setItem('marifah-admin-token', token);
  },

  logout() {
    sessionStorage.removeItem('marifah-admin-token');
    window.location.href = '/admin/index.html';
  },

  requireAuth() {
    if (!this.getToken()) {
      window.location.href = '/admin/index.html';
      return false;
    }
    return true;
  },

  // ==========================================
  // API FETCH WRAPPER
  // ==========================================
  async api(url, options = {}) {
    const token = this.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-token': token } : {}),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.logout();
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      return data;
    } catch (error) {
      if (error.message !== 'Failed to fetch') {
        this.toast(error.message, 'error');
      }
      throw error;
    }
  },

  async apiGet(url) {
    return this.api(url);
  },

  async apiPost(url, body) {
    return this.api(url, { method: 'POST', body: JSON.stringify(body) });
  },

  async apiPut(url, body) {
    return this.api(url, { method: 'PUT', body: JSON.stringify(body) });
  },

  async apiDelete(url) {
    return this.api(url, { method: 'DELETE' });
  },

  // ==========================================
  // LOGIN
  // ==========================================
  async login(password) {
    const data = await this.api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });

    if (data && data.token) {
      this.setToken(data.token);
      return true;
    }
    return false;
  },

  // ==========================================
  // MODALS
  // ==========================================
  openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('visible');
  },

  closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('visible');
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('visible'));
  },

  // ==========================================
  // TOASTS
  // ==========================================
  toast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ==========================================
  // HELPERS
  // ==========================================
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString('fr-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Set active sidebar link
  setActivePage(page) {
    document.querySelectorAll('.admin-sidebar__link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
  }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    Admin.closeAllModals();
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') Admin.closeAllModals();
});
