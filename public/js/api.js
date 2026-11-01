const API = {
  async request(path, { method = 'GET', body } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';

    const token = Auth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch('/api' + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Cannot reach the server. Please try again.');
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      // response had no JSON body
    }

    if (!res.ok) {
      if (res.status === 401 && token) Auth.logout();
      throw new Error((data && data.error) || 'Something went wrong.');
    }
    return data;
  },

  getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const qs = query.toString();
    return this.request('/products' + (qs ? `?${qs}` : ''));
  },
  getProduct(id) {
    return this.request(`/products/${id}`);
  },
  getCategories() {
    return this.request('/products/categories');
  },

  register(name, email, password) {
    return this.request('/auth/register', { method: 'POST', body: { name, email, password } });
  },
  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  },

  createOrder(items, address) {
    return this.request('/orders', { method: 'POST', body: { items, address } });
  },
  getOrders() {
    return this.request('/orders');
  },
};