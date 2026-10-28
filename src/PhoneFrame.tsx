import React, { createContext, useContext } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { colors } from './theme';

type Size = { width: number; height: number };
const FrameContext = createContext<Size>({ width: 390, height: 844 });
export const useFrame = () => useContext(FrameContext);

// In Chrome the app is shown inside a phone-sized frame, centered on the page.
// On a real phone it simply fills the screen.
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const win = useWindowDimensions();

  if (Platform.OS !== 'web' || win.width < 500) {
    return <FrameContext.Provider value={{ width: win.width, height: win.height }}>{children}</FrameContext.Provider>;
  }

  const height = Math.min(844, win.height - 32);
  const width = 390;
  return (
    <View style={{ flex: 1, backgroundColor: '#0F241B', alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width,
          height,
          borderRadius: 44,
          overflow: 'hidden',
          backgroundColor: colors.cream,
          borderWidth: 6,
          borderColor: '#000',
        }}
      >
        <FrameContext.Provider value={{ width: width - 12, height: height - 12 }}>{children}</FrameContext.Provider>
      </View>
    </View>
  );
}
