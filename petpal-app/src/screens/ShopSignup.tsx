import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { PET_TYPES, PetType, useAuth } from '../auth';
import { ApiError } from '../api';
import { getMyLocation, SKOPJE } from '../location';
import { parseCoords } from '../format';
import { BackButton, Btn, Chip, ErrorBanner, Field, ScreenScroll, Segmented, Txt } from '../ui';
import type { RootStackParamList } from '../navigation';

type Kind = 'Shop' | 'Vet' | 'EmergencyVet';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const timeOk = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v.trim());

export default function ShopSignup({ navigation }: NativeStackScreenProps<RootStackParamList, 'ShopSignup'>) {
  const { t } = useI18n();
  const { registerShop } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kind, setKind] = useState<Kind>('Shop');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Skopje');
  const [coordText, setCoordText] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; real: boolean }>({ ...SKOPJE, real: false });
  const [locating, setLocating] = useState(false);
  const [animals, setAnimals] = useState<PetType[]>(['Dog', 'Cat']);
  const [days, setDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [opens, setOpens] = useState('09:00');
  const [closes, setCloses] = useState('19:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});

  const is24 = kind === 'EmergencyVet';

  async function locate() {
    setLocating(true);
    setCoords(await getMyLocation());
    setLocating(false);
  }

  function toggleAnimal(p: PetType) {
    setAnimals((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }
  function toggleDay(d: string) {
    setDays((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = t('err.required');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = t('err.email');
    if (password.length < 8) e.password = t('err.password');
    if (!name.trim()) e.name = t('err.required');
    if (!phone.trim()) e.phone = t('err.required');
    if (!address.trim()) e.address = t('err.required');
    if (animals.length === 0) e.animals = t('err.animals');
    const typed = coordText.trim() ? parseCoords(coordText) : null;
    if (coordText.trim() && !typed) e.coords = t('pf.coordsBad');
    if (!is24) {
      if (!timeOk(opens)) e.opens = t('err.time');
      if (!timeOk(closes)) e.closes = t('err.time');
    }
    setFe(e);
    setError(null);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      await registerShop({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim() || null,
        shop: {
          type: kind,
          name: name.trim(),
          description: null,
          address: address.trim(),
          city: city.trim() || null,
          websiteUrl: website.trim() || null,
          phone: phone.trim(),
          latitude: (typed ?? coords).latitude,
          longitude: (typed ?? coords).longitude,
          isOpen24h: is24,
          servesPetTypes: animals,
          workingHours: is24 ? [] : days.map((day) => ({ day, opens: `${opens.trim()}:00`, closes: `${closes.trim()}:00` })),
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <ScreenScroll>
      <BackButton onPress={() => navigation.goBack()} />
      <Txt variant="display" style={{ marginTop: 18, fontSize: 30 }}>
        {t('shop.title')}
      </Txt>
      <Txt variant="muted" style={{ marginTop: 6, marginBottom: 20 }}>
        {t('shop.subtitle')}
      </Txt>

      <ErrorBanner message={error} />
      <Field label={t('shop.yourName')} value={fullName} onChangeText={setFullName} error={fe.fullName} />
      <Field
        label={t('shop.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        error={fe.email}
      />
      <Field
        label={t('shop.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        error={fe.password}
      />

      <Txt variant="display" style={{ fontSize: 22, marginTop: 14, marginBottom: 12 }}>
        {t('shop.section')}
      </Txt>
      <View style={{ marginBottom: 14 }}>
        <Segmented<Kind>
          value={kind}
          onChange={setKind}
          options={[
            { value: 'Shop', label: t('shop.kind.Shop') },
            { value: 'Vet', label: t('shop.kind.Vet') },
            { value: 'EmergencyVet', label: t('shop.kind.EmergencyVet') },
          ]}
        />
      </View>
      <Field label={t('shop.name')} value={name} onChangeText={setName} error={fe.name} />
      <Field label={t('shop.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={fe.phone} />
      <Field label={t('shop.website')} value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" />
      <Field label={t('shop.address')} value={address} onChangeText={setAddress} error={fe.address} />
      <Field label={t('shop.city')} value={city} onChangeText={setCity} />

      <Txt variant="bold" style={{ marginBottom: 8 }}>
        {t('shop.location')}
      </Txt>
      <Btn label={t('shop.useLocation')} variant="outline" height={48} onPress={locate} loading={locating} />
      <View style={{ marginTop: 12 }}>
        <Field label={t('pf.coords')} value={coordText} onChangeText={setCoordText} placeholder="41.9981, 21.4254" autoCapitalize="none" error={fe.coords} />
      </View>
      <Txt variant="muted" style={{ marginTop: -4, marginBottom: 14, fontSize: 12 }}>{t('pf.coordsHint')}</Txt>
      <Txt variant="muted" style={{ marginBottom: 14, fontSize: 13 }}>
        {coordText.trim() ? '' : coords.real
          ? `${t('shop.locationSet')} (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
          : t('shop.locationDefault')}
      </Txt>

      <Txt variant="bold" style={{ marginBottom: 8 }}>
        {t('shop.animals')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: fe.animals ? 4 : 14 }}>
        {PET_TYPES.map((p) => (
          <Chip key={p} label={t(`pet.${p}` as const)} selected={animals.includes(p)} onPress={() => toggleAnimal(p)} />
        ))}
      </View>
      {fe.animals ? (
        <Txt style={{ color: colors.danger, fontSize: 12, marginBottom: 10, marginLeft: 8 }}>{fe.animals}</Txt>
      ) : null}

      {!is24 ? (
        <>
          <Txt variant="bold" style={{ marginBottom: 8 }}>
            {t('shop.hours')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {DAYS.map((d) => (
              <Chip key={d} label={t(`day.${d}` as const)} selected={days.includes(d)} color={colors.amber} onPress={() => toggleDay(d)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label={t('shop.opens')} value={opens} onChangeText={setOpens} error={fe.opens} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t('shop.closes')} value={closes} onChangeText={setCloses} error={fe.closes} />
            </View>
          </View>
        </>
      ) : null}

      <Btn label={t('shop.submit')} onPress={submit} loading={busy} style={{ marginTop: 10 }} />
    </ScreenScroll>
  );
}
