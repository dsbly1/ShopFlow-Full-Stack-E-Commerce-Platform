const BASE = 'https://shop-flow-full-stack-e-commerce-pla.vercel.app/api';

function getToken() {
  return localStorage.getItem('sf_token') || localStorage.getItem('token') || '';
}

const api = {
  async get(path) {
    const res = await fetch(BASE + path, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async patch(path, body) {
    const res = await fetch(BASE + path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async delete(path) {
    const res = await fetch(BASE + path, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    return res.json();
  }
};
