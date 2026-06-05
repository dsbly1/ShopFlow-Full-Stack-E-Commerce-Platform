// ============================================================
// ShopFlow — Navbar: swap Login/Logout based on auth state
// ============================================================
(function() {
  const user  = localStorage.getItem('sf_user');
  const link  = document.getElementById('authLink');
  const cart  = document.getElementById('cartCount');

  if (user && link) {
    const parsed = JSON.parse(user);
    link.textContent = `Logout (${parsed.name.split(' ')[0]})`;
    link.href = '#';
    link.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('sf_token');
      localStorage.removeItem('sf_user');
      window.location.href = '/index.html';
    });
  }
})();
