import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { useAuth, PetType } from '../auth';
import { useLocation } from '../location';
import { api } from '../api';
import { colors, fonts } from '../theme';
import { PetFace, petColor } from '../icons';
import { BackButton, Btn, Card, ErrorBanner, ScreenScroll, Segmented, Txt } from '../ui';
import { ago } from '../format';
import type { Paged } from '../types';
import type { RootStackParamList } from '../navigation';

type Item = {
  id: string; type: 'Lost' | 'Found'; petType: PetType; title: string; description: string | null;
  contactPhone: string | null; createdAt: string; distanceKm: number | null; isResolved?: boolean;
  userId?: string; ownerId?: string; reporterId?: string;
};
type F = 'All' | 'Lost' | 'Found';

export default function LostFound({ navigation }: NativeStackScreenProps<RootStackParamList, 'LostFound'>) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { coords } = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [f, setF] = useState<F>('All');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await api<Paged<Item>>('GET', '/lostfound', undefined, { query: { lat: coords.latitude, lng: coords.longitude, radiusKm: 10, pageSize: 50 } });
      setItems(r?.items ?? []);
    } catch {
      setErr(t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [coords.latitude, coords.longitude, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resolve = async (id: string) => {
    try { await api('POST', `/lostfound/${id}/resolve`); } catch {}
    load();
  };

  const shown = items.filter((i) => !i.isResolved && (f === 'All' || i.type === f));

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.lilac} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{t('lf.title')}</Txt>
      </View>
      <View style={{ marginTop: 14 }}>
        <Segmented<F> value={f} onChange={setF} options={[{ value: 'All', label: t('lf.all') }, { value: 'Lost', label: t('lf.lost') }, { value: 'Found', label: t('lf.found') }]} />
      </View>
      <Txt variant="muted" style={{ marginVertical: 10, fontSize: 13 }}>{t('lf.within')}</Txt>

      {loading ? <ActivityIndicator color={colors.ink} /> : err ? (
        <><ErrorBanner message={err} /><Btn label={t('common.retry')} variant="outline" onPress={load} /></>
      ) : shown.length === 0 ? <Txt variant="muted">{t('lf.empty')}</Txt> : shown.map((i) => {
        const mine = !!user && [i.userId, i.ownerId, i.reporterId].includes(user.id);
        return (
          <Card key={i.id} shadow style={{ marginBottom: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: petColor[i.petType] ?? colors.lilac, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                <PetFace type={i.petType} size={42} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: i.type === 'Lost' ? colors.coral : colors.lime }}>
                    <Txt variant="small" style={{ fontFamily: fonts.display, fontSize: 12 }}>{t(i.type === 'Lost' ? 'lf.LOST' : 'lf.FOUND')}</Txt>
                  </View>
                  <Txt variant="muted" style={{ fontSize: 12 }}>{[ago(i.createdAt, lang), i.distanceKm != null ? `${i.distanceKm.toFixed(1)} km` : null].filter(Boolean).join(' · ')}</Txt>
                </View>
                <Txt variant="bold" style={{ marginTop: 4 }}>{i.title}</Txt>
                {i.description ? <Txt variant="muted" style={{ fontSize: 13 }}>{i.description}</Txt> : null}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {i.contactPhone ? (
                <Pressable accessibilityRole="button" onPress={() => Linking.openURL(`tel:${i.contactPhone}`)} style={{ flex: 1, height: 38, borderRadius: 999, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt variant="small" style={{ color: colors.cream, fontFamily: fonts.bold }}>{t('lf.contact')} · {i.contactPhone}</Txt>
                </Pressable>
              ) : null}
              {mine ? (
                <Pressable accessibilityRole="button" onPress={() => resolve(i.id)} style={{ flex: 1, height: 38, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt variant="small" style={{ fontFamily: fonts.bold }}>{t('lf.resolve')}</Txt>
                </Pressable>
              ) : null}
            </View>
          </Card>
        );
      })}

      <View style={{ marginTop: 8 }}><Btn label={t('lf.report')} onPress={() => navigation.navigate('ReportPet')} /></View>
    </ScreenScroll>
  );
}
