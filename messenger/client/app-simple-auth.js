/**
 * Simple Authentication Module for Messenger
 */

// Authentication functions
window.messengerAuth = {
  async checkSession() {
    const token = localStorage.getItem('sessionToken');
    if (!token) return null;
    
    try {
      const res = await fetch('/api/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token })
      });
      const data = await res.json();
      return data.success ? data.user : null;
    } catch (e) {
      return null;
    }
  },

  async login(username, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('username', data.user.username);
      return data;
    }
    throw new Error(data.error || 'Login failed');
  },

  async register(username, password) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Registration failed');
    }
    // Auto-login after register
    return await this.login(username, password);
  },

  logout() {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('username');
  },

  getToken() {
    return localStorage.getItem('sessionToken');
  }
};
