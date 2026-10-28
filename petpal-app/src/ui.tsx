import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts } from './theme';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------- Text ----------
type TxtProps = React.ComponentProps<typeof Text> & { variant?: 'display' | 'body' | 'bold' | 'small' | 'muted' };

export function Txt({ variant = 'body', style, ...rest }: TxtProps) {
  const base: Record<string, TextStyle> = {
    display: { fontFamily: fonts.display, fontSize: 32, color: colors.ink, letterSpacing: -1 },
    body: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
    bold: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
    small: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
    muted: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  };
  return <Text {...rest} style={[base[variant], style]} />;
}

// ---------- Button with the "sticker" offset shadow ----------
type BtnProps = {
  label: string;
  onPress?: () => void;
  variant?: 'dark' | 'lime' | 'coral' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  right?: React.ReactNode;
};

export function Btn({ label, onPress, variant = 'dark', loading, disabled, style, height = 56, right }: BtnProps) {
  const bg = { dark: colors.ink, lime: colors.lime, coral: colors.coral, outline: colors.white }[variant];
  const fg = variant === 'dark' ? colors.cream : colors.ink;
  const shadow = variant === 'dark' ? colors.coral : colors.ink;
  const off = disabled || loading;
  return (
    <View style={[{ borderRadius: 999, backgroundColor: shadow, paddingBottom: 5, opacity: off ? 0.6 : 1 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={off}
        onPress={onPress}
        style={({ pressed }) => ({
          height,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: variant === 'dark' ? 0 : 2,
          borderColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          transform: [{ translateY: pressed ? 3 : 0 }],
        })}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: fg }}>{label}</Text>
            {right}
          </>
        )}
      </Pressable>
    </View>
  );
}

// ---------- Text field ----------
type FieldProps = TextInputProps & { label: string; error?: string | null };

export function Field({ label, error, style, ...rest }: FieldProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 6, marginLeft: 4 }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7C9486"
        {...rest}
        style={[
          {
            height: 52,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: error ? colors.danger : colors.ink,
            backgroundColor: colors.white,
            paddingHorizontal: 20,
            fontFamily: fonts.medium,
            fontSize: 16,
            color: colors.ink,
          },
          style,
        ]}
      />
      {error ? (
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.danger, marginTop: 4, marginLeft: 8 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ---------- Chip ----------
export function Chip({
  label,
  selected,
  onPress,
  color = colors.lime,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: colors.ink,
        backgroundColor: selected ? color : colors.white,
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}

// ---------- Segmented control ----------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.ink,
        borderRadius: 999,
        padding: 3,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.ink : 'transparent',
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: on ? colors.cream : colors.ink }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Card ----------
export function Card({
  children,
  style,
  bg = colors.white,
  shadow,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  shadow?: boolean;
}) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, any>;
  const outer: Record<string, any> = {};
  const rest: Record<string, any> = {};
  Object.keys(flat).forEach((k) => (k.startsWith('margin') || k === 'alignSelf' || k === 'width' ? outer : rest)[k] = flat[k]);
  const inner = (
    <View style={[{ backgroundColor: bg, borderWidth: 2, borderColor: colors.ink, borderRadius: 22, padding: 14 }, shadow ? rest : flat]}>
      {children}
    </View>
  );
  if (!shadow) return inner;
  return <View style={[{ backgroundColor: colors.ink, borderRadius: 22, paddingBottom: 4 }, outer]}>{inner}</View>;
}

// ---------- Screen helpers ----------

export function BackButton({ onPress, color = colors.white }: { onPress: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: colors.ink,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 5l-7 7 7 7" />
      </Svg>
    </Pressable>
  );
}

export function ScreenScroll({ children, bottomPad = 32 }: { children: React.ReactNode; bottomPad?: number }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: bottomPad + insets.bottom }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: '#FDE3DF',
        borderWidth: 2,
        borderColor: colors.danger,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.danger }}>{message}</Text>
    </View>
  );
}
