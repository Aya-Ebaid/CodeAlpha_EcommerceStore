const Auth = {
  TOKEN_KEY: 'darhome_token',
  USER_KEY: 'darhome_user',

  getToken() {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY));
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return Boolean(this.getToken());
  },

  save(token, user) {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch {
      // storage blocked, user stays logged out
    }
    this.notify();
  },

  logout() {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch {
      // ignore
    }
    this.notify();
  },

  notify() {
    window.dispatchEvent(new Event('auth:change'));
  },
};