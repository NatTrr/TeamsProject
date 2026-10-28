import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { api } from '../api';
import { colors, fonts } from '../theme';
import { Btn, ErrorBanner, ScreenScroll, Txt } from '../ui';
import { PlaceCard } from '../cards';
import type { PlaceSummary } from '../types';

export default function MyPlaces() {
  const { t } = useI18n();
  const nav = useNavigation<any>();
  const [items, setItems] = useState<PlaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r: any = await api('GET', '/places/mine');
      setItems(Array.isArray(r) ? r : r?.items ?? []);
    } catch {
      setErr(t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    if (confirm !== id) return setConfirm(id);
    setItems((x) => x.filter((p) => p.id !== id));
    setConfirm(null);
    try { await api('DELETE', `/places/${id}`); } catch { load(); }
  };

  const pill = (label: string, onPress: () => void, bg: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={{ paddingHorizontal: 14, height: 34, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Txt variant="small" style={{ fontFamily: fonts.bold }}>{label}</Txt>
    </Pressable>
  );

  return (
    <ScreenScroll>
      <Txt variant="display">{t('mp.title')}</Txt>
      <View style={{ marginTop: 16 }}>
        {loading ? <ActivityIndicator color={colors.ink} /> : err ? (
          <><ErrorBanner message={err} /><Btn label={t('common.retry')} variant="outline" onPress={load} /></>
        ) : items.length === 0 ? <Txt variant="muted" style={{ marginBottom: 14 }}>{t('mp.none')}</Txt> : items.map((p) => (
          <View key={p.id}>
            <PlaceCard p={p} onPress={() => nav.navigate('PlaceDetail', { id: p.id })} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: -4, marginBottom: 14 }}>
              {pill(t('mp.edit'), () => nav.navigate('PlaceForm', { id: p.id }), colors.lime)}
              {pill(confirm === p.id ? t('mp.confirm') : t('mp.delete'), () => remove(p.id), confirm === p.id ? colors.coral : colors.white)}
            </View>
          </View>
        ))}
      </View>
      <Btn label={t('mp.add')} onPress={() => nav.navigate('PlaceForm', {})} />
    </ScreenScroll>
  );
}
