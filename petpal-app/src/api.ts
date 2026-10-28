import { getItem, setItem, removeItem } from './storage';

// In Chrome the API is on localhost. For a phone, create a file named .env in the
// petpal-app folder with:  EXPO_PUBLIC_API_URL=http://YOUR-MAC-IP:5080
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5080';

export type User = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  city: string | null;
  roles: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: User;
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, detail: string) {
    super(detail);
    this.status = status;
    this.code = code;
  }
}

type Tokens = { accessToken: string; refreshToken: string };
let tokens: Tokens | null = null;
let language = 'en';
let onAuthLost: (() => void) | null = null;
let refreshing: Promise<boolean> | null = null;

export function setApiLanguage(l: string) {
  language = l;
}
export function setAuthLostHandler(fn: () => void) {
  onAuthLost = fn;
}
export function hasTokens() {
  return tokens !== null;
}

export async function loadTokens() {
  const raw = await getItem('tokens');
  if (raw) {
    try {
      tokens = JSON.parse(raw) as Tokens;
    } catch {
      tokens = null;
    }
  }
  return tokens;
}

export async function saveSession(r: AuthResponse) {
  tokens = { accessToken: r.accessToken, refreshToken: r.refreshToken };
  await setItem('tokens', JSON.stringify(tokens));
}

export async function clearSession() {
  tokens = null;
  await removeItem('tokens');
}

async function refreshTokens(): Promise<boolean> {
  if (!tokens) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept-Language': language },
          body: JSON.stringify({ refreshToken: tokens!.refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as AuthResponse;
        await saveSession(data);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

async function parseError(res: Response): Promise<ApiError> {
  let code = 'error';
  let detail = `Something went wrong (${res.status}).`;
  try {
    const body = await res.json();
    if (body && typeof body === 'object') {
      if (typeof body.code === 'string') code = body.code;
      if (typeof body.detail === 'string') detail = body.detail;
      else if (body.errors && typeof body.errors === 'object') {
        // ASP.NET validation problem details: { errors: { Field: ["message"] } }
        const first = Object.values(body.errors as Record<string, string[]>)[0];
        if (Array.isArray(first) && first[0]) detail = first[0];
      } else if (typeof body.title === 'string') detail = body.title;
    }
  } catch {
    // no JSON body
  }
  return new ApiError(res.status, code, detail);
}

type Opts = { auth?: boolean; query?: Record<string, string | number | boolean | undefined | null> };

export async function api<T = unknown>(method: string, path: string, body?: unknown, opts: Opts = {}): Promise<T> {
  const auth = opts.auth !== false;
  let url = `${API_URL}${path}`;
  if (opts.query) {
    const q = Object.entries(opts.query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (q) url += `?${q}`;
  }

  const send = () => {
    const headers: Record<string, string> = { 'Accept-Language': language };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    return fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  };

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'network', 'Cannot reach the server. Is the API running?');
  }

  if (res.status === 401 && auth && tokens) {
    const ok = await refreshTokens();
    if (ok) {
      res = await send();
    } else {
      await clearSession();
      onAuthLost?.();
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
