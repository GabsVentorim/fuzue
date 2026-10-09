// Em desenvolvimento o Vite faz proxy de /api para o backend.
// Em produção, defina VITE_API_URL (ex.: https://api.fuzuepetstore.com.br/api).
const BASE = import.meta.env.VITE_API_URL || '/api';

const OFFLINE =
  'Não foi possível falar com o servidor. Verifique se o backend está rodando (npm run dev em backend/).';

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
    // Um 5xx sem corpo JSON vem do proxy ou da hospedagem, não da nossa API.
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
  // consulta pública da plaquinha (quem achou o pet)
  tag: (code) => request(`/tags/${encodeURIComponent(code)}`),

  // autenticação
  me: () => request('/auth/me'),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (body) => request('/auth/password', { method: 'PUT', body }),

  // painel da loja
  admin: {
    dashboard: () => request('/admin/dashboard'),
    tags: (params) => request('/admin/tags' + qs(params)),
    tag: (id) => request(`/admin/tags/${id}`),
    nextCode: () => request('/admin/tags/next-code'),
    createTag: (body) => request('/admin/tags', { method: 'POST', body }),
    updateTag: (id, body) => request(`/admin/tags/${id}`, { method: 'PUT', body }),
    setStatus: (id, status) => request(`/admin/tags/${id}/status`, { method: 'PATCH', body: { status } }),
    deleteTag: (id) => request(`/admin/tags/${id}`, { method: 'DELETE' }),
    uploadPhoto: (id, file) => request(`/admin/tags/${id}/photo`, { method: 'POST', body: imageForm(file) }),
    removePhoto: (id) => request(`/admin/tags/${id}/photo`, { method: 'DELETE' }),
  },
};
