// ============================================================
// ShopFlow — API Client
// All fetch calls to the backend live here
// ============================================================
const API = 'https://shopflow-full-stack-e-commerce-platform.onrender.com/api';

function getToken() { return localStorage.getItem('sf_token'); }
function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (getToken()) h['Authorization'] = `Bearer ${getToken()}`;
  return h;
}

const api = {
  get:    (path)         => fetch(`${API}${path}`, { headers: getHeaders() }).then(r => r.json()),
  post:   (path, body)   => fetch(`${API}${path}`, { method:'POST',   headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  patch:  (path, body)   => fetch(`${API}${path}`, { method:'PATCH',  headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  put:    (path, body)   => fetch(`${API}${path}`, { method:'PUT',    headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  delete: (path)         => fetch(`${API}${path}`, { method:'DELETE', headers: getHeaders() }).then(r => r.json()),
};

// Keep Render backend alive — ping every 14 minutes
(function() {
  function ping() {
    fetch('https://shopflow-full-stack-e-commerce-platform.onrender.com/api/health')
      .catch(function(){});
  }
  ping();
  setInterval(ping, 14 * 60 * 1000);
})();
