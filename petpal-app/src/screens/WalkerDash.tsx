import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { useLocation, getMyLocation } from '../location';
import { api, ApiError } from '../api';
import { colors, fonts } from '../theme';
import { BackButton, Btn, Card, Chip, ErrorBanner, Field, ScreenScroll, Txt } from '../ui';
import { fmtDateTime } from '../format';
import type { RootStackParamList } from '../navigation';

type Req = { id: string; ownerName?: string; petName?: string; petType?: string; message?: string | null; preferredTime?: string | null; status?: string; ownerPhone?: string | null };

export default function WalkerDash({ navigation }: NativeStackScreenProps<RootStackParamList, 'WalkerDash'>) {
  const { t, lang } = useI18n();
  const { coords } = useLocation();
  const [bio, setBio] = useState('');
  const [price, setPrice] = useState('300');
  const [radius, setRadius] = useState('5');
  const [active, setActive] = useState(true);
  const [pos, setPos] = useState({ latitude: coords.latitude, longitude: coords.longitude });
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    try {
      const w = await api<any>('GET', '/walkers/me');
      if (w && w.id) {
        setBio(w.bio ?? ''); setPrice(String(Math.round(w.pricePerWalk ?? 300))); setRadius(String(w.serviceRadiusKm ?? 5));
        setActive(w.isActive !== false); if (w.latitude) setPos({ latitude: w.latitude, longitude: w.longitude });
      }
    } catch {}
    try {
      const r = await api<Req[]>('GET', '/walker-requests/incoming');
      setReqs(Array.isArray(r) ? r : []);
    } catch {}
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    setErr(null); setOk(false); setBusy(true);
    try {
      await api('PUT', '/walkers/me', {
        bio: bio.trim() || null, pricePerWalk: Number(price) || 0, serviceRadiusKm: Number(radius) || 5,
        latitude: pos.latitude, longitude: pos.longitude, isActive: active,
      });
      setOk(true);
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('common.loadError'));
    } finally { setBusy(false); }
  };

  const respond = async (id: string, accept: boolean) => {
    try { await api('POST', `/walker-requests/${id}/respond`, { accept }); } catch {}
    load();
  };

  const pending = reqs.filter((r) => !r.status || r.status === 'Pending');

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.lilac} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{t('wd.title')}</Txt>
      </View>
      {loading ? <ActivityIndicator color={colors.ink} style={{ marginTop: 20 }} /> : (
        <>
          <Card bg={colors.lilac} shadow style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Txt variant="display" style={{ fontSize: 20, letterSpacing: 0 }}>{t('wd.profile')}</Txt>
              <Chip label={active ? t('wd.available') : t('wd.paused')} selected={active} onPress={() => setActive(!active)} />
            </View>
            <Field label={t('wd.bio')} value={bio} onChangeText={setBio} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Field label={t('wd.price')} value={price} onChangeText={setPrice} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Field label={t('wd.radius')} value={radius} onChangeText={setRadius} keyboardType="numeric" /></View>
            </View>
            <View style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
              <Chip label={t('wd.myLoc')} onPress={async () => { const m = await getMyLocation(); setPos({ latitude: m.latitude, longitude: m.longitude }); }} />
            </View>
            <Txt variant="small" style={{ marginBottom: 10 }}>{t('wd.privacy')}</Txt>
            <ErrorBanner message={err} />
            {ok ? <Txt variant="bold" style={{ marginBottom: 8 }}>{t('wd.saved')}</Txt> : null}
            <Btn label={t('wd.save')} loading={busy} onPress={save} height={48} />
          </Card>

          <Txt variant="display" style={{ fontSize: 20, letterSpacing: 0, marginTop: 22, marginBottom: 10 }}>{t('wd.requests')}</Txt>
          {pending.length === 0 ? <Txt variant="muted">{t('wd.noReq')}</Txt> : pending.map((r) => (
            <Card key={r.id} shadow style={{ marginBottom: 12, padding: 12 }}>
              <Txt variant="bold">{[r.ownerName, r.petName].filter(Boolean).join(' · ')}</Txt>
              {r.preferredTime ? <Txt variant="muted" style={{ fontSize: 13 }}>{fmtDateTime(r.preferredTime, lang)}</Txt> : null}
              {r.message ? <Txt style={{ marginTop: 6, fontSize: 14 }}>{r.message}</Txt> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1 }}><Btn label={t('wd.accept')} variant="lime" height={40} onPress={() => respond(r.id, true)} /></View>
                <View style={{ flex: 1 }}><Btn label={t('wd.decline')} variant="outline" height={40} onPress={() => respond(r.id, false)} /></View>
              </View>
            </Card>
          ))}
        </>
      )}
    </ScreenScroll>
  );
}
