const PLACEHOLDER = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image';

const grid    = document.getElementById('productGrid');
const search  = document.getElementById('searchInput');
const sortSel = document.getElementById('sortFilter');
const catSel  = document.getElementById('categoryFilter');

// ── Skeleton loader ──────────────────────────────────────────
function showSkeleton() {
  grid.innerHTML = Array(6).fill(`
    <div class="product-card skeleton-card" style="pointer-events:none;">
      <div class="skeleton-img" style="background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;height:200px;border-radius:8px 8px 0 0;"></div>
      <div class="card-body">
        <div class="skeleton-line" style="background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;height:16px;border-radius:4px;margin-bottom:8px;"></div>
        <div class="skeleton-line" style="background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;height:14px;width:60%;border-radius:4px;margin-bottom:8px;"></div>
        <div class="skeleton-line" style="background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;height:20px;width:40%;border-radius:4px;"></div>
      </div>
    </div>`).join('');

  // Inject shimmer keyframes once
  if (!document.getElementById('shimmer-style')) {
    const s = document.createElement('style');
    s.id = 'shimmer-style';
    s.textContent = '@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(s);
  }
}

// ── Render products ──────────────────────────────────────────
function renderProducts(products) {
  if (!products.length) {
    const q = search?.value.trim();
    grid.innerHTML = q
      ? `<div style="text-align:center;padding:4rem 2rem;grid-column:1/-1;">
           <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
           <h2 style="font-size:1.2rem;color:#1e293b;margin-bottom:.5rem;">No results for "<strong>${q}</strong>"</h2>
           <p style="color:#64748b;font-size:.95rem;">Try a different keyword or browse all products.</p>
           <button onclick="document.getElementById('searchInput').value='';loadProducts();"
             style="margin-top:1.25rem;padding:.65rem 1.5rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
             Clear Search
           </button>
         </div>`
      : '<p class="loading">No products found.</p>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const sellerLink = p.seller_id
      ? `<a href="pages/seller-profile.html?id=${p.seller_id}" onclick="event.stopPropagation()" style="font-size:.78rem;color:#2563eb;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:.35rem;margin-top:.2rem;"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.seller_name||'S')}&size=20&rounded=true&background=random&color=fff&bold=true&font-size=0.5" style="width:20px;height:20px;border-radius:50%;object-fit:cover;flex-shrink:0;" />${p.seller_name || 'View Seller'}</a>`
      : '';
    const rating = p.avg_rating && p.avg_rating > 0
      ? `⭐ ${p.avg_rating} (${p.review_count || 0})`
      : '<span style="color:#94a3b8;font-size:.78rem;">No reviews yet</span>';
    return `<div class="product-card" style="cursor:pointer;" onclick="window.location.href='pages/product-detail.html?id=${p.id}'">
      <img src="${p.image_url || PLACEHOLDER}"
           onerror="this.src='${PLACEHOLDER}'"
           alt="${p.name}" loading="lazy" />
      <div class="card-body">
        <h3>${p.name}</h3>
        ${sellerLink}
        <div class="card-price">$${parseFloat(p.price).toFixed(2)}</div>
        <div class="card-rating">${rating}</div>
        <button class="btn-primary" onclick="event.stopPropagation();addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>`;
  }).join('');
}

// ── Load categories ──────────────────────────────────────────
async function loadCategories() {
  const cats = await api.get('/categories');
  if (!Array.isArray(cats)) return;
  cats.filter(c => !c.parent_category_id).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    catSel.appendChild(opt);
  });
}

// ── Load products (handles both array and paginated response) ─
async function loadProducts() {
  showSkeleton();
  const q = new URLSearchParams({
    search: search?.value || '',
    sort:   sortSel?.value || 'created_at',
    limit:  12,
  });
  if (catSel?.value) q.set('category', catSel.value);

  try {
    const res = await api.get(`/products?${q}`);
    // Handle both old array response and new paginated response
    const products = Array.isArray(res) ? res : (res.products || []);
    renderProducts(products);
  } catch (err) {
    grid.innerHTML = `<div style="text-align:center;padding:4rem 2rem;grid-column:1/-1;">
      <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
      <p style="color:#64748b;">Could not load products. Please try again.</p>
      <button onclick="loadProducts()" style="margin-top:1rem;padding:.65rem 1.5rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Retry</button>
    </div>`;
  }
}

// ── Add to cart ──────────────────────────────────────────────
async function addToCart(productId) {
  if (!getToken()) {
    if (typeof openCartModal === 'function') { openCartModal(productId); return; }
    window.location.href = 'pages/login.html'; return;
  }
  await api.post('/cart', { product_id: productId, quantity: 1 });
  updateCartCount();
  var toast = document.getElementById('guest-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'guest-toast';
    toast.style = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:.75rem 1.5rem;border-radius:10px;font-size:.875rem;font-weight:500;z-index:600;transition:opacity .3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = 'Added to cart!';
  toast.style.opacity = '1'; toast.style.display = 'block';
  setTimeout(function() { toast.style.opacity = '0'; setTimeout(function() { toast.style.display='none'; }, 300); }, 2000);
}

// ── Event listeners ──────────────────────────────────────────
document.getElementById('searchBtn')?.addEventListener('click', loadProducts);
search?.addEventListener('keydown', e => e.key === 'Enter' && loadProducts());
sortSel?.addEventListener('change', loadProducts);
catSel?.addEventListener('change', loadProducts);

loadCategories();
loadProducts();

// ── Cart count ───────────────────────────────────────────────
async function updateCartCount() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  if (!getToken()) {
    const guest = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const total = guest.reduce((sum, i) => sum + (i.quantity || 1), 0);
    if (total > 0) { badge.textContent = total; badge.style.display = 'flex'; }
    return;
  }
  const items = await api.get('/cart');
  if (!Array.isArray(items) || !items.length) return;
  const total = items.reduce((sum, i) => sum + i.quantity, 0);
  if (total > 0) { badge.textContent = total; badge.style.display = 'flex'; }
}
updateCartCount();

// ── Read search from URL params ──────────────────────────────
(function() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('search');
  if (q && search) {
    search.value = q;
    loadProducts();
    setTimeout(() => {
      document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  }
})();

// Show friendly message during Render cold start
(function() {
  const THRESHOLD = 3000;
  let timer = setTimeout(() => {
    const el = document.getElementById('loading-msg');
    if (el) el.textContent = 'Waking up server, please wait a moment...';
  }, THRESHOLD);
  document.addEventListener('products-loaded', () => clearTimeout(timer));
})();
