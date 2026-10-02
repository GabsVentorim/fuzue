// In development Vite proxies /api to the backend.
// In production, set VITE_API_URL (e.g. https://api.minhaloja.com.br/api).
const BASE = import.meta.env.VITE_API_URL || '/api';

const OFFLINE = 'Não foi possível falar com o servidor. Verifique se o backend está rodando (npm run dev em backend/).';

async function request(path, { body, ...options } = {}) {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(BASE + path, {
      credentials: 'include',
      headers: isForm ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined || isForm ? body : JSON.stringify(body),
      ...options,
    });
  } catch {
    throw new Error(OFFLINE);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // A 5xx without a JSON body comes from the dev proxy / host, not from our API.
    const fallback = !data && res.status >= 500 ? OFFLINE : 'Algo deu errado. Tente de novo.';
    const err = new Error(data?.error || fallback);
    err.status = res.status;
    throw err;
  }
  return data ?? {};
}

const qs = (params = {}) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return s ? `?${s}` : '';
};

const imageForm = (file) => {
  const form = new FormData();
  form.append('image', file);
  return form;
};

export const api = {
  // shop
  products: (params) => request('/products' + qs(params)),
  product: (slug) => request(`/products/${slug}`),
  categories: () => request('/categories'),
  createOrder: (body) => request('/orders', { method: 'POST', body }),
  order: (id) => request(`/orders/${id}`),
  orderPayment: (id) => request(`/orders/${id}/payment`),
  payOrder: (id, body) => request(`/orders/${id}/pay`, { method: 'POST', body }),

  // auth
  me: () => request('/auth/me'),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  google: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // account
  updateProfile: (body) => request('/me', { method: 'PUT', body }),
  changePassword: (body) => request('/me/password', { method: 'PUT', body }),
  uploadAvatar: (file) => request('/me/avatar', { method: 'POST', body: imageForm(file) }),
  removeAvatar: () => request('/me/avatar', { method: 'DELETE' }),
  addresses: () => request('/me/addresses'),
  addAddress: (body) => request('/me/addresses', { method: 'POST', body }),
  updateAddress: (id, body) => request(`/me/addresses/${id}`, { method: 'PUT', body }),
  deleteAddress: (id) => request(`/me/addresses/${id}`, { method: 'DELETE' }),
  myOrders: () => request('/me/orders'),
  pets: () => request('/me/pets'),
  addPet: (body) => request('/me/pets', { method: 'POST', body }),
  updatePet: (id, body) => request(`/me/pets/${id}`, { method: 'PUT', body }),
  deletePet: (id) => request(`/me/pets/${id}`, { method: 'DELETE' }),
  uploadPetPhoto: (id, file) => request(`/me/pets/${id}/photo`, { method: 'POST', body: imageForm(file) }),

  // admin
  admin: {
    dashboard: () => request('/admin/dashboard'),
    products: (params) => request('/admin/products' + qs(params)),
    product: (id) => request(`/admin/products/${id}`),
    createProduct: (body) => request('/admin/products', { method: 'POST', body }),
    updateProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PUT', body }),
    deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
    adjustStock: (id, body) => request(`/admin/products/${id}/stock`, { method: 'POST', body }),
    stockMovements: (params) => request('/admin/stock-movements' + qs(params)),
    uploadImage: (file) => request('/admin/uploads', { method: 'POST', body: imageForm(file) }),
    orders: (params) => request('/admin/orders' + qs(params)),
    updateOrder: (id, body) => request(`/admin/orders/${id}`, { method: 'PATCH', body }),
    customers: (params) => request('/admin/customers' + qs(params)),
    customer: (id) => request(`/admin/customers/${id}`),
    setRole: (id, role) => request(`/admin/customers/${id}/role`, { method: 'PATCH', body: { role } }),
  },
};
