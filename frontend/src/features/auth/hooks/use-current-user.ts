import { useEffect, useState } from 'react';
import { tokenStorage } from '@/lib/api-client';

interface CurrentUser {
  id: string;
  email: string;
}

interface JwtPayload {
  sub?: unknown;
  email?: unknown;
}

function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payloadPart = parts[1];
  if (payloadPart === undefined) return null;
  try {
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function readUser(): CurrentUser | null {
  const token = tokenStorage.get();
  if (token === null) return null;
  const payload = decodeJwt(token);
  if (payload === null) return null;
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
  return { id: payload.sub, email: payload.email };
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(readUser);

  useEffect(() => {
    const sync = () => setUser(readUser());
    window.addEventListener('storage', sync);
    window.addEventListener('fintrack:logout', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('fintrack:logout', sync);
    };
  }, []);

  return user;
}
