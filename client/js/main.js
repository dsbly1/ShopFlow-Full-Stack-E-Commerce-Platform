const PLACEHOLDER = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image';

const grid    = document.getElementById('productGrid');
const search  = document.getElementById('searchInput');
const sortSel = document.getElementById('sortFilter');
const catSel  = document.getElementById('categoryFilter');

async function loadCategories() {
  const cats = await api.get('/categories');
  if (!Array.isArray(cats)) return;
  // Only show top-level categories (no parent)
  cats.filter(c => !c.parent_category_id).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    catSel.appendChild(opt);
  });
}

function renderProducts(products) {
  if (!products.length) {
    const q = document.getElementById('searchInput')?.value.trim();
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
      ? `<a href="pages/seller-profile.html?id=${p.seller_id}" onclick="event.stopPropagation()" style="font-size:.78rem;color:#2563eb;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:.25rem;margin-top:.2rem;">🏪 ${p.seller_name || 'View Seller'}</a>`
      : '';
    const rating = p.avg_rating
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

async function loadProducts() {
  grid.innerHTML = '<p class="loading">Loading products…</p>';
  const q = new URLSearchParams({
    search: search?.value || '',
    sort:   sortSel?.value || 'created_at',
  });
  if (catSel?.value) q.set('category', catSel.value);
  const products = await api.get(`/products?${q}`);
  renderProducts(Array.isArray(products) ? products : []);
}

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

document.getElementById('searchBtn')?.addEventListener('click', loadProducts);
search?.addEventListener('keydown', e => e.key === 'Enter' && loadProducts());
sortSel?.addEventListener('change', loadProducts);
catSel?.addEventListener('change', loadProducts);

loadCategories();
loadProducts();

// Update cart count — badge appears only when items exist
async function updateCartCount() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  if (!getToken()) {
    // Show guest cart count
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

// Read search query from URL params (e.g. from purchases/about page search bar)
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
