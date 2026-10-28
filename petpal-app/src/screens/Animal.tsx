import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { useLocation } from '../location';
import { api, ApiError } from '../api';
import { colors } from '../theme';
import { PetFace, petColor } from '../icons';
import { BackButton, Btn, ErrorBanner, ScreenScroll, Segmented, Txt } from '../ui';
import { PlaceCard, WalkerCard } from '../cards';
import type { HomeResponse, PlaceSummary } from '../types';
import type { HomeStackParamList } from '../navigation';

type Tab = 'Walkers' | 'Shops' | 'DogParks' | 'Vets';

export default function Animal({ navigation, route }: NativeStackScreenProps<HomeStackParamList, 'Animal'>) {
  const { petType } = route.params;
  const { t } = useI18n();
  const { coords } = useLocation();
  const [data, setData] = useState<HomeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab | null>(route.params.tab ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      let r = await api<HomeResponse>('GET', `/home/${petType}`, undefined, {
        query: { lat: coords.latitude, lng: coords.longitude, radiusKm: 10 },
      });
      // Parrots and hamsters come without vets from the API, so we add them here.
      if (!r.features.includes('Vets')) {
        const q = { lat: coords.latitude, lng: coords.longitude, radiusKm: 10 };
        const get = (type: string) =>
          api<{ items: PlaceSummary[] }>('GET', '/places', undefined, { query: { ...q, type } })
            .then((x) => x?.items ?? [])
            .catch(() => [] as PlaceSummary[]);
        const [a, b] = await Promise.all([get('Vet'), get('EmergencyVet')]);
        const seen = new Set<string>();
        const vets = [...a, ...b]
          .filter((v) => (v.servesPetTypes ?? []).includes(petType) && !seen.has(v.id) && seen.add(v.id))
          .sort((x, y) => (x.distanceKm ?? 99) - (y.distanceKm ?? 99));
        r = { ...r, vets, features: [...r.features, 'Vets'] };
      }
      setData(r);
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 ? e.message : t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [petType, coords.latitude, coords.longitude, t]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = useMemo(
    () => (data?.features ?? []).filter((f): f is Tab => ['Walkers', 'Shops', 'DogParks', 'Vets'].includes(f)),
    [data],
  );
  const current: Tab | null = tab && tabs.includes(tab) ? tab : tabs[0] ?? null;
  const hasFood = !!data?.features.includes('FoodCheck');

  const list = (() => {
    if (!data || !current) return [];
    if (current === 'Walkers') return data.walkers.map((w) => <WalkerCard key={w.id} w={w} onPress={() => (navigation as any).navigate('Walker', { id: w.id })} />);
    const src = current === 'Shops' ? data.shops : current === 'DogParks' ? data.dogParks : data.vets;
    return src.map((p) => <PlaceCard key={p.id} p={p} onPress={() => (navigation as any).navigate('PlaceDetail', { id: p.id })} />);
  })();

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={petColor[petType]} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ flex: 1, fontSize: 32 }}>{t(`pets.${petType}` as any)}</Txt>
        <PetFace type={petType} size={52} />
      </View>

      {tabs.length > 1 ? (
        <View style={{ marginTop: 16 }}>
          <Segmented options={tabs.map((x) => ({ value: x, label: t(`seg.${x}` as any) }))} value={current as Tab} onChange={setTab} />
        </View>
      ) : null}

      {hasFood ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('FoodChat', { petType })}
          style={{ marginTop: 14, backgroundColor: colors.ink, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Txt variant="display" style={{ fontSize: 18, color: colors.cream, letterSpacing: 0 }}>{t('food.title')}</Txt>
            <Txt variant="small" style={{ color: colors.cream, opacity: 0.85 }}>{t('food.sub')}</Txt>
          </View>
          <View style={{ backgroundColor: petColor[petType], borderRadius: 999, paddingHorizontal: 14, height: 38, justifyContent: 'center' }}>
            <Txt variant="small" style={{ fontFamily: 'Rubik_700Bold' }}>{t('food.cta')}</Txt>
          </View>
        </Pressable>
      ) : null}

      {current ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, marginBottom: 10 }}>
          <Txt variant="display" style={{ fontSize: 20, letterSpacing: 0 }}>{tabs.length === 1 ? t(`seg.${current}` as any) : t('near.title')}</Txt>
          <Txt variant="small" style={{ fontFamily: 'Rubik_700Bold' }}>{t('near.within')}</Txt>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: 24 }} />
      ) : err ? (
        <View style={{ marginTop: 16 }}>
          <ErrorBanner message={err} />
          <Btn label={t('common.retry')} variant="outline" onPress={load} />
        </View>
      ) : current && list.length === 0 ? (
        <Txt variant="muted" style={{ marginTop: 8 }}>{t('empty.nothing')}</Txt>
      ) : (
        list
      )}
    </ScreenScroll>
  );
}
