import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { api } from '../api';
import { colors, fonts } from '../theme';
import { BackButton, Btn, Card, ErrorBanner, ScreenScroll, Txt } from '../ui';
import { fmtDateTime } from '../format';
import type { RootStackParamList } from '../navigation';

type Req = {
  id: string; walkerId: string; walkerName: string; petName?: string | null; message?: string | null;
  preferredTime?: string | null; status: 'Pending' | 'Accepted' | 'Declined' | string; contactPhone?: string | null;
};
const tint: Record<string, string> = { Pending: colors.amber, Accepted: colors.lime, Declined: colors.coral };

export default function MyRequests({ navigation }: NativeStackScreenProps<RootStackParamList, 'MyRequests'>) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await api<Req[]>('GET', '/walker-requests/sent');
      setItems(Array.isArray(r) ? r : []);
    } catch {
      setErr(t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.amber} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 26, flex: 1 }}>{t('req.title')}</Txt>
      </View>
      <View style={{ marginTop: 16 }}>
        {loading ? <ActivityIndicator color={colors.ink} /> : err ? (
          <><ErrorBanner message={err} /><Btn label={t('common.retry')} variant="outline" onPress={load} /></>
        ) : items.length === 0 ? <Txt variant="muted">{t('req.none')}</Txt> : items.map((r) => (
          <Card key={r.id} shadow style={{ marginBottom: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt variant="bold" style={{ flex: 1, fontSize: 17 }} numberOfLines={1}>{r.walkerName}</Txt>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: tint[r.status] ?? colors.line }}>
                <Txt variant="small" style={{ fontFamily: fonts.bold, fontSize: 12 }}>{(t as any)(`req.${r.status}`) === `req.${r.status}` ? r.status : (t as any)(`req.${r.status}`)}</Txt>
              </View>
            </View>
            <Txt variant="muted" style={{ fontSize: 13, marginTop: 2 }}>
              {[r.petName ? `${t('req.for')} ${r.petName}` : null, r.preferredTime ? fmtDateTime(r.preferredTime, lang) : null].filter(Boolean).join(' · ')}
            </Txt>
            {r.message ? <Txt style={{ marginTop: 6, fontSize: 14 }}>{r.message}</Txt> : null}
            {r.status === 'Accepted' ? (
              r.contactPhone ? (
                <Pressable accessibilityRole="button" onPress={() => Linking.openURL(`tel:${r.contactPhone}`)} style={{ marginTop: 10, height: 40, borderRadius: 999, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt variant="small" style={{ color: colors.cream, fontFamily: fonts.bold }}>{t('req.phone')}: {r.contactPhone}</Txt>
                </Pressable>
              ) : <Txt variant="muted" style={{ marginTop: 8, fontSize: 12 }}>{t('req.noPhone')}</Txt>
            ) : null}
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Walker', { id: r.walkerId })} style={{ marginTop: 8 }}>
              <Txt variant="small" style={{ textDecorationLine: 'underline' }}>{r.walkerName} →</Txt>
            </Pressable>
          </Card>
        ))}
      </View>
    </ScreenScroll>
  );
}
