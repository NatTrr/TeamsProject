import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { PET_TYPES, PetType } from '../auth';
import { getMyLocation } from '../location';
import { api, ApiError } from '../api';
import { colors } from '../theme';
import { petColor } from '../icons';
import { BackButton, Btn, Chip, ErrorBanner, Field, ScreenScroll, Txt } from '../ui';
import type { PlaceDetailT } from '../types';
import type { RootStackParamList } from '../navigation';

const TYPES = ['Shop', 'Vet', 'EmergencyVet', 'DogPark'] as const;
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
type Row = { o: string; c: string };
const empty: Row = { o: '', c: '' };

export default function PlaceForm({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'PlaceForm'>) {
  const id = route.params?.id;
  const { t } = useI18n();
  const [type, setType] = useState<(typeof TYPES)[number]>('Shop');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Skopje');
  const [phone, setPhone] = useState('');
  const [web, setWeb] = useState('');
  const [desc, setDesc] = useState('');
  const [coords, setCoords] = useState('');
  const [open24, setOpen24] = useState(false);
  const [serves, setServes] = useState<PetType[]>(['Dog', 'Cat']);
  const [wk, setWk] = useState<Row>({ o: '09:00', c: '19:00' });
  const [sat, setSat] = useState<Row>(empty);
  const [sun, setSun] = useState<Row>(empty);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<PlaceDetailT>('GET', `/places/${id}`)
      .then((p) => {
        setType(p.type); setName(p.name); setAddress(p.address ?? ''); setCity(p.city ?? ''); setPhone(p.phone ?? '');
        setWeb(p.websiteUrl ?? ''); setDesc(p.description ?? ''); setCoords(`${p.latitude}, ${p.longitude}`);
        setOpen24(p.isOpen24h); setServes(p.servesPetTypes);
        const h = (d: string): Row => { const x = p.workingHours?.find((y) => y.day === d); return x ? { o: x.opens.slice(0, 5), c: x.closes.slice(0, 5) } : empty; };
        setWk(h('Monday')); setSat(h('Saturday')); setSun(h('Sunday'));
      })
      .catch(() => setErr(t('common.loadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  const toggleServe = (p: PetType) => setServes((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));
  const mine = async () => { const m = await getMyLocation(); setCoords(`${m.latitude.toFixed(5)}, ${m.longitude.toFixed(5)}`); };

  const save = async () => {
    setErr(null);
    if (!name.trim()) return setErr(t('pf.nameReq'));
    const parts = coords.split(/[,;]\s*|\s+/).filter(Boolean).map((x) => Number(x.replace(',', '.')));
    if (parts.length !== 2 || parts.some((x) => isNaN(x)) || Math.abs(parts[0]) > 90 || Math.abs(parts[1]) > 180) return setErr(t('pf.coordsBad'));
    if (serves.length === 0) return setErr(t('pf.animalsReq'));
    const hours: { day: string; opens: string; closes: string }[] = [];
    const ok = (s: string) => /^\d{1,2}:\d{2}$/.test(s.trim());
    const add = (days: string[], r: Row) => {
      if (!r.o.trim() && !r.c.trim()) return true;
      if (!ok(r.o) || !ok(r.c)) return false;
      const f = (s: string) => `${s.trim().padStart(5, '0')}:00`;
      days.forEach((d) => hours.push({ day: d, opens: f(r.o), closes: f(r.c) }));
      return true;
    };
    if (!open24 && !(add(WEEK, wk) && add(['Saturday'], sat) && add(['Sunday'], sun))) return setErr(t('pf.timeBad'));
    const w = web.trim();
    const webOk = /[a-z0-9]\.[a-z]{2,}/i.test(w);
    if (w && !webOk) return setErr(t('pf.webBad'));
    const webUrl = w ? (/^https?:\/\//i.test(w) ? w : `https://${w}`) : null;
    const ph = phone.trim();
    if (ph && ph.replace(/\D/g, '').length < 5) return setErr(t('pf.phoneBad'));
    const descClean = desc.trim().replace(/^[\/.\-]+$/, '');
    setBusy(true);
    try {
      const body = {
        type, name: name.trim(), description: descClean || null, address: address.trim() || null, city: city.trim() || null,
        websiteUrl: webUrl, phone: ph || null, latitude: parts[0], longitude: parts[1],
        isOpen24h: open24, servesPetTypes: serves, workingHours: open24 ? [] : hours,
      };
      await api(id ? 'PUT' : 'POST', id ? `/places/${id}` : '/places', body);
      navigation.goBack();
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('common.loadError'));
      setBusy(false);
    }
  };

  const hoursRow = (label: string, r: Row, set: (r: Row) => void) => (
    <View style={{ marginBottom: 6 }}>
      <Txt variant="small" style={{ marginLeft: 4, marginBottom: 4 }}>{label}</Txt>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label={t('pf.opens')} value={r.o} onChangeText={(v) => set({ ...r, o: v })} placeholder="09:00" /></View>
        <View style={{ flex: 1 }}><Field label={t('pf.closes')} value={r.c} onChangeText={(v) => set({ ...r, c: v })} placeholder="19:00" /></View>
      </View>
    </View>
  );

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.lime} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{id ? t('pf.edit') : t('pf.add')}</Txt>
      </View>
      {loading ? <ActivityIndicator color={colors.ink} style={{ marginTop: 20 }} /> : (
        <View style={{ marginTop: 16 }}>
          <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('pf.type')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {TYPES.map((x) => <Chip key={x} label={t(`pf.t.${x}` as any)} selected={type === x} onPress={() => setType(x)} />)}
          </View>
          <Field label={t('pf.name')} value={name} onChangeText={setName} />
          <Field label={t('pf.address')} value={address} onChangeText={setAddress} />
          <Field label={t('pf.city')} value={city} onChangeText={setCity} />
          <Field label={t('pf.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label={t('pf.web')} value={web} onChangeText={setWeb} autoCapitalize="none" />
          <Field label={t('pf.desc')} value={desc} onChangeText={setDesc} multiline style={{ height: 90, borderRadius: 22, paddingTop: 14, textAlignVertical: 'top' }} />
          <Field label={t('pf.coords')} value={coords} onChangeText={setCoords} placeholder="41.9981, 21.4254" autoCapitalize="none" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 14 }}>
            <Chip label={t('pf.useMine')} onPress={mine} />
          </View>
          <Txt variant="muted" style={{ fontSize: 12, marginTop: -6, marginBottom: 14 }}>{t('pf.coordsHint')}</Txt>

          <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('pf.serves')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {PET_TYPES.map((p) => <Chip key={p} label={t(`pets.${p}` as any)} color={petColor[p]} selected={serves.includes(p)} onPress={() => toggleServe(p)} />)}
          </View>

          <View style={{ alignSelf: 'flex-start', marginBottom: 14 }}>
            <Chip label={t('pf.open24')} selected={open24} onPress={() => setOpen24(!open24)} />
          </View>
          {!open24 ? (
            <>
              <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('pf.hours')}</Txt>
              {hoursRow(t('pf.monfri'), wk, setWk)}
              {hoursRow(t('pf.sat'), sat, setSat)}
              {hoursRow(t('pf.sun'), sun, setSun)}
            </>
          ) : null}
          <ErrorBanner message={err} />
          <Btn label={t('pf.save')} loading={busy} onPress={save} />
        </View>
      )}
    </ScreenScroll>
  );
}
