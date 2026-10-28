import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { useLocation } from '../location';
import { api } from '../api';
import { colors, fonts } from '../theme';
import { Icon } from '../icons';
import { Txt } from '../ui';
import GlobeFrame from '../GlobeFrame';
import type { PlaceDetailT } from '../types';

type Feature = { type: 'Feature'; geometry: unknown; properties: { id: string; name: string; placeType: string } };
type F = 'All' | 'Shop' | 'DogPark' | 'Vet';
const DOT: Record<F, string> = { All: colors.cream, Shop: colors.coral, DogPark: colors.lime, Vet: colors.amber };

export default function MapScreen({ scriptBase }: { scriptBase?: string }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [focus, setFocus] = useState<{ center: [number, number]; nonce: number } | null>(null);
  const { coords } = useLocation();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [filter, setFilter] = useState<F>('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [place, setPlace] = useState<PlaceDetailT | null>(null);
  const [favs, setFavs] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      api<{ features: Feature[] }>('GET', '/map/pins', undefined, { query: { lat: coords.latitude, lng: coords.longitude, radiusKm: 50 } })
        .then((r) => setFeatures(r?.features ?? []))
        .catch(() => {});
      api<{ id: string }[]>('GET', '/favorites', undefined, { query: { lat: coords.latitude, lng: coords.longitude } })
        .then((r) => setFavs((r ?? []).map((x) => x.id)))
        .catch(() => {});
    }, [coords.latitude, coords.longitude]),
  );

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: features.filter((f) => filter === 'All' || (filter === 'Vet' ? ['Vet', 'EmergencyVet'].includes(f.properties.placeType) : f.properties.placeType === filter)),
    }),
    [features, filter],
  );
  const center = useMemo<[number, number]>(() => [coords.longitude, coords.latitude], [coords.longitude, coords.latitude]);

  const pick = (id: string, fly = false) => {
    setSelected(id);
    setPlace(null);
    api<PlaceDetailT>('GET', `/places/${id}`)
      .then((p) => {
        setPlace(p);
        if (fly) setFocus({ center: [p.longitude, p.latitude], nonce: Date.now() });
      })
      .catch(() => {});
  };

  // Coming from "Show on map" on a place page.
  const focusId: string | undefined = route.params?.focusId;
  const focusTs: number | undefined = route.params?.ts;
  React.useEffect(() => {
    if (focusId) pick(focusId, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, focusTs]);
  const close = () => { setSelected(null); setPlace(null); };

  const toggleFav = async (id: string) => {
    const on = favs.includes(id);
    setFavs((x) => (on ? x.filter((y) => y !== id) : [...x, id]));
    try { await api(on ? 'DELETE' : 'PUT', `/favorites/${id}`); } catch { setFavs((x) => (on ? [...x, id] : x.filter((y) => y !== id))); }
  };

  const chips: { v: F; label: string }[] = [
    { v: 'All', label: t('saved.all') },
    { v: 'Shop', label: t('seg.Shops') },
    { v: 'DogPark', label: t('seg.DogParks') },
    { v: 'Vet', label: t('seg.Vets') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Txt variant="display" style={{ color: colors.cream }}>{t('tab.map')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {chips.map((c) => {
            const on = filter === c.v;
            return (
              <Pressable key={c.v} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { setFilter(c.v); close(); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: on ? colors.lime : colors.cream, backgroundColor: on ? colors.lime : 'transparent' }}>
                {c.v !== 'All' ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: DOT[c.v] }} /> : null}
                <Txt variant="small" style={{ fontFamily: fonts.bold, fontSize: 14, color: on ? colors.ink : colors.cream }}>{c.label}</Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <GlobeFrame geojson={geojson} center={center} selected={selected} focus={focus} onPin={(id) => pick(id)} onEmpty={close} scriptBase={scriptBase} />

        {place && selected ? (
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12, backgroundColor: colors.ink, borderRadius: 26, paddingBottom: 4 }}>
            <View style={{ backgroundColor: colors.cream, borderWidth: 2, borderColor: colors.ink, borderRadius: 26, padding: 14 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: place.type === 'Shop' ? colors.coral : place.type === 'DogPark' ? colors.lime : colors.amber, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={place.type === 'Shop' ? 'shop' : 'pin'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="display" style={{ fontSize: 19, letterSpacing: 0 }} numberOfLines={1}>{place.name}</Txt>
                  <Txt variant="muted" style={{ fontSize: 13 }} numberOfLines={1}>
                    {[t(`pf.t.${place.type}` as any), place.servesPetTypes.map((p) => t(`pets.${p}` as any)).join(', ')].join(' · ')}
                  </Txt>
                  <Txt variant="small" style={{ marginTop: 3 }}>
                    {[place.avgRating != null ? `★ ${place.avgRating.toFixed(1)} (${place.reviewCount})` : t('place.new'), place.isOpen24h ? t('place.open24') : null].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={favs.includes(place.id) ? t('place.unsave') : t('place.save')} onPress={() => toggleFav(place.id)}
                  style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.ink, backgroundColor: favs.includes(place.id) ? colors.coral : colors.white, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="heart" size={20} fill={favs.includes(place.id) ? colors.ink : 'none'} />
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" onPress={() => nav.navigate('PlaceDetail', { id: place.id })}
                style={{ height: 44, marginTop: 12, borderRadius: 999, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Txt style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 15 }}>{t('map.details')}</Txt>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
