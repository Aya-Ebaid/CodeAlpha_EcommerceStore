const PLACEHOLDER = '/images/placeholder.svg';
const app = document.getElementById('app');

/* ---------- Helpers ---------- */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let toastTimer;
function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast show' + (type === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// If any product image fails to load, swap it for the placeholder.
app.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName === 'IMG' && !img.dataset.fallback) {
    img.dataset.fallback = '1';
    img.src = PLACEHOLDER;
  }
}, true);

/* ---------- Header ---------- */
function updateHeader() {
  const loggedIn = Auth.isLoggedIn();
  const user = Auth.getUser();

  document.getElementById('nav-login').hidden = loggedIn;
  document.getElementById('nav-orders').hidden = !loggedIn;
  document.getElementById('nav-logout').hidden = !loggedIn;

  const nameEl = document.getElementById('nav-user');
  nameEl.hidden = !loggedIn;
  nameEl.textContent = user && user.name ? `Hi, ${user.name.split(' ')[0]}` : '';

  document.getElementById('cart-count').textContent = Cart.count();
}

function markActiveNav(path) {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + path);
  });
}

document.getElementById('nav-logout').addEventListener('click', () => {
  Auth.logout();
  location.hash = '#/';
  showToast('You have been signed out.');
});

/* ---------- Home page ---------- */
const homeState = { q: '', category: '', sort: '' };
let homeRequest = 0;

function stockTag(product) {
  if (product.stock === 0) return 'Sold out';
  if (product.stock <= 3) return `Only ${product.stock} left`;
  return '';
}

function productCard(p) {
  const tag = stockTag(p);
  return `
    <a class="card" href="#/product/${esc(p._id)}">
      <div class="card-media">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
        ${tag ? `<span class="tag">${esc(tag)}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-cat">${esc(p.category)}</div>
        <div class="card-name">${esc(p.name)}</div>
        <div class="card-price">${formatPrice(p.price)}</div>
      </div>
    </a>`;
}

function skeletonGrid(count) {
  const card = `
    <div class="card skeleton">
      <div class="card-media"></div>
      <div class="card-body"><div class="line"></div><div class="line short"></div></div>
    </div>`;
  return `<div class="grid" aria-hidden="true">${card.repeat(count)}</div>`;
}

function renderChips(categories) {
  const chips = document.getElementById('chips');
  if (!chips) return;
  const all = ['', ...categories];
  chips.innerHTML = all.map((c) => `
    <button type="button" class="chip${homeState.category === c ? ' active' : ''}" data-category="${esc(c)}">
      ${c ? esc(c) : 'All'}
    </button>`).join('');
}

async function loadProducts() {
  const results = document.getElementById('results');
  if (!results) return;

  const requestId = ++homeRequest;
  results.innerHTML = skeletonGrid(8);

  try {
    const products = await API.getProducts(homeState);
    if (requestId !== homeRequest) return;

    if (!products.length) {
      results.innerHTML = `
        <div class="empty">
          <h2>No products found</h2>
          <p>Try a different search or category.</p>
          <button class="btn btn-outline" id="reset" type="button">Clear filters</button>
        </div>`;
      document.getElementById('reset').addEventListener('click', () => {
        Object.assign(homeState, { q: '', category: '', sort: '' });
        renderHome();
      });
      return;
    }
    results.innerHTML = `<div class="grid">${products.map(productCard).join('')}</div>`;
  } catch (err) {
    if (requestId !== homeRequest) return;
    results.innerHTML = `
      <div class="empty">
        <h2>Something went wrong</h2>
        <p>${esc(err.message)}</p>
        <button class="btn btn-outline" id="retry" type="button">Try again</button>
      </div>`;
    document.getElementById('retry').addEventListener('click', loadProducts);
  }
}

async function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <h1>Furniture for every room of your home.</h1>
      <p>Sofas, beds, dining sets and more, chosen to last and priced fairly.</p>
      <div class="toolbar">
        <input class="input search" id="search" type="search"
               placeholder="Search furniture" aria-label="Search furniture" value="${esc(homeState.q)}">
        <select class="input sort" id="sort" aria-label="Sort products">
          <option value="">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
    </section>
    <div class="chips" id="chips" role="group" aria-label="Categories"></div>
    <div id="results"></div>`;

  const sortEl = document.getElementById('sort');
  sortEl.value = homeState.sort;

  document.getElementById('search').addEventListener('input', debounce((e) => {
    homeState.q = e.target.value.trim();
    loadProducts();
  }));

  sortEl.addEventListener('change', () => {
    homeState.sort = sortEl.value;
    loadProducts();
  });

  document.getElementById('chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    homeState.category = chip.dataset.category;
    document.querySelectorAll('#chips .chip').forEach((c) => {
      c.classList.toggle('active', c === chip);
    });
    loadProducts();
  });

  renderChips([]);
  loadProducts();

  try {
    renderChips(await API.getCategories());
  } catch {
    // chips stay as "All" only
  }
}

/* ---------- Product page ---------- */
async function renderProduct(id) {
  app.innerHTML = `
    <a class="back-link" href="#/">&larr; Back to shop</a>
    <div class="detail skeleton" aria-hidden="true">
      <div class="detail-media"></div>
      <div class="detail-info">
        <div class="line"></div><div class="line"></div><div class="line short"></div>
      </div>
    </div>`;

  try {
    const p = await API.getProduct(id);
    if (location.hash.slice(1) !== `/product/${id}`) return;

    document.title = `${p.name} | Dar Home`;
    const soldOut = p.stock === 0;
    const maxQty = Math.min(p.stock, 99);

    let stockText = 'In stock';
    let stockClass = '';
    if (soldOut) { stockText = 'Out of stock'; stockClass = 'out'; }
    else if (p.stock <= 3) { stockText = `Only ${p.stock} left`; stockClass = 'low'; }

    app.innerHTML = `
      <a class="back-link" href="#/">&larr; Back to shop</a>
      <div class="detail">
        <div class="detail-media">
          <img src="${esc(p.image)}" alt="${esc(p.name)}">
        </div>
        <div class="detail-info">
          <div class="card-cat">${esc(p.category)}</div>
          <h1>${esc(p.name)}</h1>
          <div class="detail-price">${formatPrice(p.price)}</div>
          <p class="detail-desc">${esc(p.description)}</p>
          <p class="stock-note ${stockClass}">${stockText}</p>
          <div class="buy-row">
            ${soldOut ? '' : `
              <div class="qty">
                <button type="button" id="qty-minus" aria-label="Decrease quantity">&minus;</button>
                <span id="qty-value" aria-live="polite">1</span>
                <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
              </div>`}
            <button class="btn" id="add-btn" type="button" ${soldOut ? 'disabled' : ''}>
              ${soldOut ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>`;

    if (soldOut) return;

    let qty = 1;
    const qtyEl = document.getElementById('qty-value');
    const setQty = (value) => {
      qty = Math.max(1, Math.min(value, maxQty));
      qtyEl.textContent = qty;
    };

    document.getElementById('qty-minus').addEventListener('click', () => setQty(qty - 1));
    document.getElementById('qty-plus').addEventListener('click', () => setQty(qty + 1));

    document.getElementById('add-btn').addEventListener('click', () => {
      if (Cart.add(p, qty)) {
        showToast(`${qty} \u00d7 ${p.name} added to your cart.`);
      } else {
        showToast('You already have the maximum available in your cart.', 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `
      <div class="empty">
        <h2>Product not found</h2>
        <p>${esc(err.message)}</p>
        <a class="btn" href="#/">Back to shop</a>
      </div>`;
  }
}

/* ---------- Cart page ---------- */
function cartRow(item) {
  const name = esc(item.name);
  return `
    <div class="cart-row" data-id="${esc(item.productId)}">
      <a class="cart-thumb" href="#/product/${esc(item.productId)}">
        <img src="${esc(item.image)}" alt="">
      </a>
      <div>
        <div class="cart-name">${name}</div>
        <div class="cart-unit">${formatPrice(item.price)} each</div>
        <div class="qty">
          <button type="button" data-action="minus" aria-label="Decrease quantity of ${name}">&minus;</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="plus" aria-label="Increase quantity of ${name}">+</button>
        </div>
      </div>
      <div class="cart-line">
        <div class="line-total">${formatPrice(item.price * item.quantity)}</div>
        <button class="link-btn remove-btn" type="button" data-action="remove">Remove</button>
      </div>
    </div>`;
}

function refreshCartView() {
  if (!Cart.items.length) return renderCart();

  document.querySelectorAll('.cart-row').forEach((row) => {
    const item = Cart.items.find((i) => i.productId === row.dataset.id);
    if (!item) {
      row.remove();
      return;
    }
    row.querySelector('.qty span').textContent = item.quantity;
    row.querySelector('.line-total').textContent = formatPrice(item.price * item.quantity);
  });

  document.getElementById('sum-count').textContent = Cart.count();
  document.getElementById('sum-total').textContent = formatPrice(Cart.total());
}

function renderOrderSuccess(order) {
  const number = String(order._id).slice(-6).toUpperCase();
  app.innerHTML = `
    <div class="empty">
      <h2>Thank you for your order</h2>
      <p>Order <strong>#${esc(number)}</strong> is confirmed. Total: ${formatPrice(order.total)}.</p>
      <p>We will deliver to: ${esc(order.address)}</p>
      <div class="btn-row">
        <a class="btn" href="#/orders">View my orders</a>
        <a class="btn btn-outline" href="#/">Keep shopping</a>
      </div>
    </div>`;
}

function renderCart() {
  if (!Cart.items.length) {
    app.innerHTML = `
      <div class="empty">
        <h2>Your cart is empty</h2>
        <p>Find something you love and it will show up here.</p>
        <a class="btn" href="#/">Browse furniture</a>
      </div>`;
    return;
  }

  const loggedIn = Auth.isLoggedIn();
  const checkout = loggedIn
    ? `
      <div class="field">
        <label for="address">Shipping address</label>
        <textarea class="input" id="address" rows="3" placeholder="Street, building, city"></textarea>
      </div>
      <p class="form-error" id="checkout-error" role="alert"></p>
      <button class="btn btn-block" id="place-order" type="button">Place order</button>`
    : `<a class="btn btn-block" href="#/login">Sign in to checkout</a>`;

  app.innerHTML = `
    <h1 class="page-title">Your cart</h1>
    <div class="cart-layout">
      <div id="cart-items">${Cart.items.map(cartRow).join('')}</div>
      <aside class="summary">
        <h2>Order summary</h2>
        <div class="summary-row"><span>Items</span><span id="sum-count">${Cart.count()}</span></div>
        <div class="summary-row"><span>Shipping</span><span>Free</span></div>
        <div class="summary-row summary-total"><span>Total</span><span id="sum-total">${formatPrice(Cart.total())}</span></div>
        ${checkout}
      </aside>
    </div>`;

  document.getElementById('cart-items').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.closest('.cart-row').dataset.id;
    const item = Cart.items.find((i) => i.productId === id);
    if (!item) return;

    if (btn.dataset.action === 'remove') {
      Cart.remove(id);
    } else if (btn.dataset.action === 'minus') {
      Cart.setQuantity(id, item.quantity - 1);
    } else {
      if (item.quantity >= Math.min(item.stock, 99)) {
        showToast('Maximum available quantity reached.', 'error');
        return;
      }
      Cart.setQuantity(id, item.quantity + 1);
    }
    refreshCartView();
  });

  if (!loggedIn) return;

  const addressEl = document.getElementById('address');
  const errorEl = document.getElementById('checkout-error');
  const placeBtn = document.getElementById('place-order');

  placeBtn.addEventListener('click', async () => {
    const address = addressEl.value.trim();
    errorEl.textContent = '';

    if (address.length < 10) {
      errorEl.textContent = 'Please enter your full shipping address.';
      addressEl.focus();
      return;
    }

    placeBtn.disabled = true;
    placeBtn.textContent = 'Placing order...';

    try {
      const order = await API.createOrder(Cart.toOrderItems(), address);
      Cart.clear();
      renderOrderSuccess(order);
    } catch (err) {
      errorEl.textContent = err.message;
      placeBtn.disabled = false;
      placeBtn.textContent = 'Place order';
    }
  });
}


/* ---------- Sign in / Create account ---------- */
function renderAuth(mode) {
  if (Auth.isLoggedIn()) {
    location.hash = '#/';
    return;
  }

  const isRegister = mode === 'register';
  app.innerHTML = `
    <div class="form-card">
      <h1>${isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p class="form-sub">${isRegister
        ? 'Join Dar Home to place orders and track them.'
        : 'Sign in to check out and see your orders.'}</p>

      <form id="auth-form" novalidate>
        ${isRegister ? `
          <div class="field">
            <label for="name">Full name</label>
            <input class="input" id="name" type="text" autocomplete="name">
          </div>` : ''}
        <div class="field">
          <label for="email">Email</label>
          <input class="input" id="email" type="email" autocomplete="email">
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input class="input" id="password" type="password"
                 autocomplete="${isRegister ? 'new-password' : 'current-password'}">
        </div>
        <p class="form-error" id="auth-error" role="alert"></p>
        <button class="btn btn-block" id="auth-submit" type="submit">
          ${isRegister ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p class="form-switch">${isRegister
        ? 'Already have an account? <a href="#/login">Sign in</a>'
        : 'New here? <a href="#/register">Create an account</a>'}</p>
    </div>`;

  const form = document.getElementById('auth-form');
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit');
  const idleLabel = isRegister ? 'Create account' : 'Sign in';

  document.getElementById(isRegister ? 'name' : 'email').focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const name = isRegister ? document.getElementById('name').value.trim() : '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (isRegister && !name) {
      errorEl.textContent = 'Please enter your name.';
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errorEl.textContent = 'Please enter a valid email.';
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters.';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = isRegister ? 'Creating account...' : 'Signing in...';

    try {
      const data = isRegister
        ? await API.register(name, email, password)
        : await API.login(email, password);

      Auth.save(data.token, data.user);
      showToast(`Welcome, ${data.user.name.split(' ')[0]}!`);
      location.hash = Cart.items.length ? '#/cart' : '#/';
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = idleLabel;
    }
  });
}
/* ---------- My orders ---------- */
function orderCard(order) {
  const number = String(order._id).slice(-6).toUpperCase();
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const lines = order.items.map((i) => `
    <div class="order-item">
      <span>${esc(i.name)} \u00d7 ${i.quantity}</span>
      <span>${formatPrice(i.price * i.quantity)}</span>
    </div>`).join('');

  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <strong>Order #${esc(number)}</strong>
          <div class="order-meta">${esc(date)}</div>
        </div>
        <span class="badge">${esc(order.status)}</span>
      </div>
      ${lines}
      <div class="order-total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
      <p class="order-address">Delivering to: ${esc(order.address)}</p>
    </article>`;
}
async function renderOrders() {
  if (!Auth.isLoggedIn()) {
    location.hash = '#/login';
    return;
  }

  const skeleton = `
    <div class="order-card skeleton" aria-hidden="true">
      <div class="line"></div><div class="line short"></div>
    </div>`;

  app.innerHTML = `
    <h1 class="page-title">My orders</h1>
    <div id="orders-list">${skeleton.repeat(2)}</div>`;

  const list = document.getElementById('orders-list');

  try {
    const orders = await API.getOrders();
    if (location.hash.slice(1) !== '/orders') return;

    list.innerHTML = orders.length
      ? orders.map(orderCard).join('')
      : `
        <div class="empty">
          <h2>No orders yet</h2>
          <p>When you place an order it will show up here.</p>
          <a class="btn" href="#/">Start shopping</a>
        </div>`;
  } catch (err) {
    if (!Auth.isLoggedIn()) {
      location.hash = '#/login';
      return;
    }
    list.innerHTML = `
      <div class="empty">
        <h2>Could not load your orders</h2>
        <p>${esc(err.message)}</p>
        <button class="btn btn-outline" id="retry-orders" type="button">Try again</button>
      </div>`;
    document.getElementById('retry-orders').addEventListener('click', renderOrders);
  }
}
/* ---------- Pages we will build in the next steps ---------- */
function comingSoon(title) {
  return () => {
    app.innerHTML = `
      <div class="empty">
        <h2>${esc(title)}</h2>
        <p>This page is coming in the next step.</p>
        <a class="btn" href="#/">Back to shop</a>
      </div>`;
  };
}

function renderNotFound() {
  app.innerHTML = `
    <div class="empty">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <a class="btn" href="#/">Back to shop</a>
    </div>`;
}

/* ---------- Router ---------- */
const routes = [
  { pattern: /^\/$/, render: renderHome },
  { pattern: /^\/product\/([a-f0-9]{24})$/, render: renderProduct },
  { pattern: /^\/cart$/, render: renderCart },
  { pattern: /^\/login$/, render: () => renderAuth('login') },
  { pattern: /^\/register$/, render: () => renderAuth('register') },
  { pattern: /^\/orders$/, render: renderOrders },
];
function router(scrollTop = false) {
  const path = location.hash.slice(1) || '/';
  markActiveNav(path);
    document.title = 'Dar Home | Furniture for every room';

  const route = routes.find((r) => r.pattern.test(path));
  if (route) route.render(...path.match(route.pattern).slice(1));
  else renderNotFound();

  if (scrollTop) window.scrollTo(0, 0);
}

/* ---------- Start ---------- */
window.addEventListener('hashchange', () => router(true));
window.addEventListener('auth:change', updateHeader);
window.addEventListener('cart:change', updateHeader);

updateHeader();
router();