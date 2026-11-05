import React from 'react';
import { Text, View } from 'react-native';
import { colors, fonts } from './theme';
import type { DateFieldProps } from './DateField';

const pad = (n: number) => String(n).padStart(2, '0');

// Browser version: a native calendar / clock pop-up.
export default function DateField({ label, mode, value, onChange, futureOnly }: DateFieldProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const min = !futureOnly || mode === 'time' ? undefined : mode === 'date' ? today : `${today}T00:00`;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 6, marginLeft: 4 }}>{label}</Text>
      {React.createElement('input', {
        type: mode === 'datetime' ? 'datetime-local' : mode,
        value,
        min,
        'aria-label': label,
        onChange: (e: any) => onChange(e.target.value),
        onClick: (e: any) => { try { e.target.showPicker?.(); } catch {} },
        style: {
          height: 52,
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 999,
          border: `2px solid ${colors.ink}`,
          backgroundColor: colors.white,
          padding: '0 20px',
          fontFamily: fonts.medium,
          fontSize: 16,
          color: colors.ink,
          outline: 'none',
          cursor: 'pointer',
        },
      })}
    </View>
  );
}
