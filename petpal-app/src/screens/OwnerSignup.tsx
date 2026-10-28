import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { PET_TYPES, PetType, useAuth } from '../auth';
import { ApiError } from '../api';
import { BackButton, Btn, Chip, ErrorBanner, Field, ScreenScroll, Txt } from '../ui';
import type { RootStackParamList } from '../navigation';

const petColors: Record<PetType, string> = {
  Dog: colors.coral,
  Cat: colors.lilac,
  Parrot: colors.lime,
  Hamster: colors.amber,
};

export default function OwnerSignup({ navigation }: NativeStackScreenProps<RootStackParamList, 'OwnerSignup'>) {
  const { t } = useI18n();
  const { registerOwner } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Skopje');
  const [selected, setSelected] = useState<PetType[]>([]);
  const [names, setNames] = useState<Partial<Record<PetType, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});

  function toggle(p: PetType) {
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = t('err.required');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = t('err.email');
    if (password.length < 8) e.password = t('err.password');
    setFe(e);
    setError(null);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await registerOwner({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        pets: selected.map((type) => ({
          type,
          name: names[type]?.trim() || null,
          breed: null,
          birthDate: null,
          photoUrl: null,
        })),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <ScreenScroll>
      <BackButton onPress={() => navigation.goBack()} />
      <Txt variant="display" style={{ marginTop: 18, fontSize: 32 }}>
        {t('owner.title')}
      </Txt>
      <Txt variant="muted" style={{ marginTop: 6, marginBottom: 20 }}>
        {t('owner.subtitle')}
      </Txt>

      <ErrorBanner message={error} />
      <Field label={t('owner.fullName')} value={fullName} onChangeText={setFullName} autoComplete="name" error={fe.fullName} />
      <Field
        label={t('owner.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        error={fe.email}
      />
      <Field
        label={t('owner.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        error={fe.password}
      />
      <Field label={t('owner.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <Field label={t('owner.city')} value={city} onChangeText={setCity} />

      <Txt variant="bold" style={{ marginTop: 6, marginBottom: 10 }}>
        {t('owner.pets')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {PET_TYPES.map((p) => (
          <Chip key={p} label={t(`pet.${p}` as const)} selected={selected.includes(p)} color={petColors[p]} onPress={() => toggle(p)} />
        ))}
      </View>
      {selected.map((p) => (
        <Field
          key={p}
          label={`${t(`pet.${p}` as const)} · ${t('owner.petName')}`}
          value={names[p] ?? ''}
          onChangeText={(v) => setNames((n) => ({ ...n, [p]: v }))}
        />
      ))}

      <Btn label={t('owner.submit')} onPress={submit} loading={busy} style={{ marginTop: 10 }} />
    </ScreenScroll>
  );
}
