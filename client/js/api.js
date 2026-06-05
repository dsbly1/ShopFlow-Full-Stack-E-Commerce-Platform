// ============================================================
// ShopFlow — API Client
// All fetch calls to the backend live here
// ============================================================
const API = 'http://127.0.0.1:3000/api';

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
