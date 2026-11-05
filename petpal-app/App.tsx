import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
  Rubik_800ExtraBold,
} from '@expo-google-fonts/rubik';
import { I18nProvider } from './src/i18n';
import { AuthProvider } from './src/auth';
import { PhoneFrame } from './src/PhoneFrame';
import Navigation from './src/navigation';
import { LocationProvider } from './src/location';
import { colors } from './src/theme';

// Browser tab: our own paw icon instead of the Expo default.
const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='#F47F68'/>" +
      "<g fill='#17372A'><ellipse cx='32' cy='41' rx='13' ry='10'/><circle cx='17' cy='29' r='6'/><circle cx='28' cy='21' r='6'/><circle cx='40' cy='21' r='6'/><circle cx='51' cy='29' r='6'/></g></svg>"
  );

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = 'PetPal';
    document.querySelectorAll("link[rel*='icon']").forEach((n) => n.parentNode?.removeChild(n));
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = FAVICON;
    document.head.appendChild(link);
  }, []);

  const [loaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
    Rubik_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PhoneFrame>
        {loaded ? (
          <I18nProvider>
            <AuthProvider>
              <LocationProvider><Navigation /></LocationProvider>
            </AuthProvider>
          </I18nProvider>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
            <ActivityIndicator color={colors.ink} />
          </View>
        )}
      </PhoneFrame>
    </SafeAreaProvider>
  );
}
