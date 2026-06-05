// ============================================================
// ShopFlow — Homepage: product listing + search + filters
// ============================================================

const grid     = document.getElementById('productGrid');
const search   = document.getElementById('searchInput');
const sortSel  = document.getElementById('sortFilter');
const catSel   = document.getElementById('categoryFilter');

async function loadCategories() {
  // Stub — replace with real API call when backend is running
  ['Electronics','Clothing','Books','Home & Garden','Sports'].forEach(c => {
    const opt = document.createElement('option');
    opt.textContent = c;
    catSel.appendChild(opt);
  });
}

function renderProducts(products) {
  if (!products.length) { grid.innerHTML = '<p class="loading">No products found.</p>'; return; }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image_url || '/public/images/placeholder.png'}" alt="${p.name}" loading="lazy" />
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

// Event listeners
document.getElementById('searchBtn')?.addEventListener('click', loadProducts);
search?.addEventListener('keydown', e => e.key === 'Enter' && loadProducts());
sortSel?.addEventListener('change', loadProducts);
catSel?.addEventListener('change', loadProducts);

// Init
loadCategories();
loadProducts();
