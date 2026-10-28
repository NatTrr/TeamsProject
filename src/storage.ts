import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Works in Chrome (localStorage) and on phones (AsyncStorage).
export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return window.localStorage.getItem(key);
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(key, value);
    else await AsyncStorage.setItem(key, value);
  } catch {
    // storage unavailable, ignore
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') window.localStorage.removeItem(key);
    else await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}
