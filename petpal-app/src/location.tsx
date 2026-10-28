import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as Location from 'expo-location';

export const SKOPJE = { latitude: 41.9981, longitude: 21.4254 };

// Returns the device location, or the center of Skopje if permission is denied.
export async function getMyLocation(): Promise<{ latitude: number; longitude: number; real: boolean }> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ...SKOPJE, real: false };
    const pos = await Location.getCurrentPositionAsync({});
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, real: true };
  } catch {
    return { ...SKOPJE, real: false };
  }
}

type Coords = { latitude: number; longitude: number };
type LocCtx = { coords: Coords; isReal: boolean; toggle: () => Promise<void> };
const Ctx = createContext<LocCtx>({ coords: SKOPJE, isReal: false, toggle: async () => {} });
export const useLocation = () => useContext(Ctx);

// The app starts in the center of Skopje (where the demo data is).
// The user can switch to their real location from the Home screen.
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords>(SKOPJE);
  const [isReal, setIsReal] = useState(false);

  const toggle = useCallback(async () => {
    if (isReal) {
      setCoords(SKOPJE);
      setIsReal(false);
      return;
    }
    const me = await getMyLocation();
    setCoords({ latitude: me.latitude, longitude: me.longitude });
    setIsReal(me.real);
  }, [isReal]);

  const value = useMemo(() => ({ coords, isReal, toggle }), [coords, isReal, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
