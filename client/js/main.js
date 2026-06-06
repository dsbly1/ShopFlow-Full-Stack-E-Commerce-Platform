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
  if (!products.length) { grid.innerHTML = '<p class="loading">No products found.</p>'; return; }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image_url || PLACEHOLDER}"
           onerror="this.src='${PLACEHOLDER}'"
           alt="${p.name}" loading="lazy" />
      <div class="card-body">
        <h3>${p.name}</h3>
        <div class="card-price">$${parseFloat(p.price).toFixed(2)}</div>
        <div class="card-rating">⭐ ${p.avg_rating || 'No reviews'} (${p.review_count || 0})</div>
        <button class="btn-primary" onclick="addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  `).join('');
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
  if (!getToken()) { window.location.href = 'pages/login.html'; return; }
  await api.post('/cart', { product_id: productId, quantity: 1 });
  alert('Added to cart!');
}

document.getElementById('searchBtn')?.addEventListener('click', loadProducts);
search?.addEventListener('keydown', e => e.key === 'Enter' && loadProducts());
sortSel?.addEventListener('change', loadProducts);
catSel?.addEventListener('change', loadProducts);

loadCategories();
loadProducts();

// Update cart count — badge appears only when items exist
async function updateCartCount() {
  if (!getToken()) return;
  const items = await api.get('/cart');
  if (!Array.isArray(items) || !items.length) return;
  const total = items.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartCount');
  if (badge && total > 0) {
    badge.textContent = total;
    badge.style.display = "flex";
  }
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
