import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, AuthResponse, clearSession, loadTokens, saveSession, setAuthLostHandler, User } from './api';
import { getItem, removeItem, setItem } from './storage';

export type PetType = 'Dog' | 'Cat' | 'Parrot' | 'Hamster';
export const PET_TYPES: PetType[] = ['Dog', 'Cat', 'Parrot', 'Hamster'];

export type PetInput = {
  type: PetType;
  name: string | null;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
};

export type PlaceInput = {
  type: 'Shop' | 'Vet' | 'EmergencyVet' | 'DogPark';
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  websiteUrl: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  isOpen24h: boolean;
  servesPetTypes: PetType[];
  workingHours: { day: string; opens: string; closes: string }[];
};

type AuthCtx = {
  user: User | null;
  ready: boolean;
  isShopOwner: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerOwner: (b: {
    email: string;
    password: string;
    fullName: string;
    phone: string | null;
    city: string | null;
    pets: PetInput[];
  }) => Promise<void>;
  registerShop: (b: {
    email: string;
    password: string;
    fullName: string;
    phone: string | null;
    city: string | null;
    shop: PlaceInput;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const store = useCallback(async (r: AuthResponse) => {
    await saveSession(r);
    await setItem('user', JSON.stringify(r.user));
    setUser(r.user);
  }, []);

  const dropSession = useCallback(async () => {
    await clearSession();
    await removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    setAuthLostHandler(() => {
      removeItem('user');
      setUser(null);
    });
    (async () => {
      const t = await loadTokens();
      if (t) {
        const cached = await getItem('user');
        if (cached) {
          try {
            setUser(JSON.parse(cached) as User);
          } catch {
            // ignore broken cache
          }
        }
        try {
          const me = await api<User>('GET', '/me');
          setUser(me);
          await setItem('user', JSON.stringify(me));
        } catch (e) {
          // 401 is handled by the auth-lost handler. Other errors (e.g. API offline) keep the cached user.
        }
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await api<AuthResponse>('POST', '/auth/login', { email, password }, { auth: false });
      await store(r);
    },
    [store],
  );

  const registerOwner: AuthCtx['registerOwner'] = useCallback(
    async (b) => {
      const r = await api<AuthResponse>('POST', '/auth/register/owner', b, { auth: false });
      await store(r);
    },
    [store],
  );

  const registerShop: AuthCtx['registerShop'] = useCallback(
    async (b) => {
      const r = await api<AuthResponse>('POST', '/auth/register/shop', b, { auth: false });
      await store(r);
    },
    [store],
  );

  const logout = useCallback(async () => {
    try {
      const raw = await getItem('tokens');
      if (raw) {
        const t = JSON.parse(raw) as { refreshToken: string };
        await api('POST', '/auth/logout', { refreshToken: t.refreshToken });
      }
    } catch {
      // logging out locally is enough
    }
    await dropSession();
  }, [dropSession]);

  const refreshMe = useCallback(async () => {
    const me = await api<User>('GET', '/me');
    setUser(me);
    await setItem('user', JSON.stringify(me));
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isShopOwner: !!user?.roles.includes('ShopOwner'),
      login,
      registerOwner,
      registerShop,
      logout,
      refreshMe,
    }),
    [user, ready, login, registerOwner, registerShop, logout, refreshMe],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
