const Cart = {
  KEY: 'darhome_cart',
  items: [],

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY));
      this.items = Array.isArray(saved) ? saved : [];
    } catch {
      this.items = [];
    }
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.items));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('cart:change'));
  },

  count() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  total() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  add(product, quantity = 1) {
    const existing = this.items.find((i) => i.productId === product._id);
    const current = existing ? existing.quantity : 0;
    const next = Math.min(current + quantity, product.stock, 99);

    if (next <= current) return false;

    if (existing) {
      existing.quantity = next;
      existing.stock = product.stock;
    } else {
      this.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity: next,
      });
    }
    this.save();
    return true;
  },

  setQuantity(productId, quantity) {
    const item = this.items.find((i) => i.productId === productId);
    if (!item) return;
    const q = Math.max(1, Math.min(quantity, item.stock, 99));
    item.quantity = q;
    this.save();
  },

  remove(productId) {
    this.items = this.items.filter((i) => i.productId !== productId);
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  toOrderItems() {
    return this.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  },
};

Cart.load();

function formatPrice(amount) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
}