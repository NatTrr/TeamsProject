import React from 'react';
import { Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';
import { Icon, IconName } from './icons';
import { useI18n, TKey } from './i18n';

const meta: Record<string, { icon: IconName; label: TKey }> = {
  HomeTab: { icon: 'home', label: 'tab.home' },
  MapTab: { icon: 'map', label: 'tab.map' },
  SavedTab: { icon: 'heart', label: 'tab.saved' },
  ProfileTab: { icon: 'user', label: 'tab.profile' },
  PlacesTab: { icon: 'shop', label: 'tab.places' },
};

// The dark pill-shaped bar from the designs.
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 14), paddingTop: 6, backgroundColor: colors.cream }}>
      <View style={{ backgroundColor: colors.coral, borderRadius: 34, paddingBottom: 4 }}>
        <View
          style={{
            height: 68,
            borderRadius: 34,
            backgroundColor: colors.ink,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingHorizontal: 12,
          }}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const m = meta[route.name];
            if (!m) return null;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={t(m.label)}
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !e.defaultPrevented) navigation.navigate(route.name as never);
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.lime : 'transparent',
                }}
              >
                <Icon name={m.icon} color={focused ? colors.ink : colors.cream} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
