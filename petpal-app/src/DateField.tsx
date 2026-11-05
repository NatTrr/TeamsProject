import React from 'react';
import { Field } from './ui';

export type DateFieldProps = { label: string; mode: 'date' | 'time' | 'datetime'; value: string; onChange: (v: string) => void; futureOnly?: boolean };

// Phone fallback: a text box (the browser version in DateField.web.tsx opens a real calendar).
export default function DateField({ label, mode, value, onChange }: DateFieldProps) {
  const ph = mode === 'date' ? '2026-11-01' : mode === 'time' ? '09:00' : '2026-11-01 18:00';
  return <Field label={label} value={value.replace('T', ' ')} onChangeText={onChange} placeholder={ph} autoCapitalize="none" />;
}
