import React from 'react';
import { ActivityIndicator, View } from 'react-native';
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

export default function App() {
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
