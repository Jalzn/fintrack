import type { ZodType } from 'zod';

const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'fintrack:token';

export const tokenStorage = {
  get: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  set: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Sem conexão com o servidor.') {
    super(message);
    this.name = 'NetworkError';
  }
}

interface FetchOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  schema?: ZodType;
}

const AUTH_ROUTES = new Set(['/auth/login', '/auth/register', '/auth/refresh']);

let refreshInFlight: Promise<string | null> | null = null;

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText.length > 0 ? res.statusText : `HTTP ${res.status}`;
  let code: string | undefined;
  try {
    const body: unknown = await res.json();
    if (typeof body === 'object' && body !== null) {
      const obj = body as Record<string, unknown>;
      if (typeof obj['message'] === 'string') message = obj['message'];
      else if (Array.isArray(obj['message']) && typeof obj['message'][0] === 'string') {
        message = obj['message'][0];
      }
      if (typeof obj['error'] === 'string') code = obj['error'];
    }
  } catch {
    // body wasn't JSON — keep statusText
  }
  return new ApiError(res.status, message, code);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight !== null) return refreshInFlight;

  refreshInFlight = (async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken?: unknown };
      if (typeof data.accessToken !== 'string') return null;
      tokenStorage.set(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function doFetch<TResponse>(
  path: string,
  options: FetchOptions,
  allowRetry: boolean,
): Promise<TResponse> {
  const { method = 'GET', body, schema } = options;
  const token = tokenStorage.get();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token !== null) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers, credentials: 'include' };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new NetworkError();
  }

  if (res.status === 401 && !AUTH_ROUTES.has(path)) {
    if (allowRetry) {
      const newToken = await refreshAccessToken();
      if (newToken !== null) {
        return doFetch<TResponse>(path, options, false);
      }
    }
    tokenStorage.clear();
    window.dispatchEvent(new Event('fintrack:logout'));
    throw await parseError(res);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }

  const json: unknown = await res.json();

  if (schema !== undefined) {
    return schema.parse(json) as TResponse;
  }

  return json as TResponse;
}

export function apiFetch<TResponse>(path: string, options: FetchOptions = {}): Promise<TResponse> {
  return doFetch<TResponse>(path, options, true);
}
