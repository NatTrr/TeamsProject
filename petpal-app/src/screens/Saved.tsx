import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useLocation } from '../location';
import { api } from '../api';
import { colors } from '../theme';
import { Icon } from '../icons';
import { Btn, ErrorBanner, ScreenScroll, Segmented, Txt } from '../ui';
import { PlaceCard } from '../cards';
import type { PlaceSummary } from '../types';

type Filter = 'All' | 'Shop' | 'DogPark' | 'Vet';

export default function Saved() {
  const { t } = useI18n();
  const { coords } = useLocation();
  const nav = useNavigation<any>();
  const [items, setItems] = useState<PlaceSummary[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await api<PlaceSummary[]>('GET', '/favorites', undefined, { query: { lat: coords.latitude, lng: coords.longitude } });
      setItems(Array.isArray(r) ? r : []);
    } catch {
      setErr(t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [coords.latitude, coords.longitude, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const remove = async (id: string) => {
    setItems((x) => x.filter((p) => p.id !== id));
    try {
      await api('DELETE', `/favorites/${id}`);
    } catch {
      load();
    }
  };

  const shown = items.filter((p) => filter === 'All' || (filter === 'Vet' ? p.type === 'Vet' || p.type === 'EmergencyVet' : p.type === filter));

  return (
    <ScreenScroll>
      <Txt variant="display">{t('tab.saved')}</Txt>
      <Txt variant="muted" style={{ marginTop: 4 }}>{t('saved.sub')}</Txt>
      <View style={{ marginTop: 14, marginBottom: 14 }}>
        <Segmented<Filter>
          options={[
            { value: 'All', label: t('saved.all') },
            { value: 'Shop', label: t('seg.Shops') },
            { value: 'DogPark', label: t('seg.DogParks') },
            { value: 'Vet', label: t('seg.Vets') },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: 20 }} />
      ) : err ? (
        <>
          <ErrorBanner message={err} />
          <Btn label={t('common.retry')} variant="outline" onPress={load} />
        </>
      ) : shown.length === 0 ? (
        <Txt variant="muted">{t('saved.empty')}</Txt>
      ) : (
        <>
          {shown.map((p) => (
            <PlaceCard
              key={p.id}
              p={p}
              onPress={() => nav.navigate('PlaceDetail', { id: p.id })}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('place.unsave')}
                  onPress={() => remove(p.id)}
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.coral, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="heart" size={20} fill={colors.ink} />
                </Pressable>
              }
            />
          ))}
          <Txt variant="muted" style={{ fontSize: 12, textAlign: 'center' }}>{t('saved.hint')}</Txt>
        </>
      )}
    </ScreenScroll>
  );
}
