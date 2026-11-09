import { API_BASE_URL, LOGIN_PAGE } from './config.js';

const TOKEN_KEY = 'accessToken';

export const session = {
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      return;
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      return;
    }
  },
};

export class ApiError extends Error {
  constructor(status, problem = {}) {
    super(problem.detail || problem.title || `Erro ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
    this.errors = problem.errors || {};
  }
}

function buildUrl(path, params) {
  const url = new URL(API_BASE_URL.replace(/\/$/, '') + path);

  if (params) {
    Object.entries(params).forEach(function ([key, value]) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url;
}

async function parseBody(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('json')) return response.json();

  const text = await response.text();
  return text || null;
}

export async function request(path, { method = 'GET', body, params, auth = false, signal } = {}) {
  const headers = { Accept: 'application/json' };

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = session.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, { title: 'Sem conexão com a API' });
  }

  const data = await parseBody(response).catch(function () {
    return null;
  });

  if (!response.ok) {
    if (response.status === 401 && auth) {
      session.clear();
      window.location.assign(LOGIN_PAGE);
    }

    const problem = data && typeof data === 'object' ? data : {};
    throw new ApiError(response.status, problem);
  }

  return data;
}

export const api = {
  get: function (path, options) {
    return request(path, { ...options, method: 'GET' });
  },
  post: function (path, body, options) {
    return request(path, { ...options, method: 'POST', body });
  },
};
