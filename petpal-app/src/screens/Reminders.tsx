import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { api } from '../api';
import { colors } from '../theme';
import { Icon } from '../icons';
import { BackButton, Btn, Card, ErrorBanner, ScreenScroll, Segmented, Txt } from '../ui';
import { fmtDateTime } from '../format';
import type { ReminderItem } from '../types';
import type { RootStackParamList } from '../navigation';

type R = ReminderItem & { petId?: string | null; notes?: string | null; repeat?: string; timeZoneId?: string };

export default function Reminders({ navigation }: NativeStackScreenProps<RootStackParamList, 'Reminders'>) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<R[]>([]);
  const [pets, setPets] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'up' | 'done'>('up');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [r, p] = await Promise.all([
        api<R[]>('GET', '/reminders', undefined, { query: { includeDone: true } }),
        api<{ id: string; name: string }[]>('GET', '/pets').catch(() => []),
      ]);
      setItems(Array.isArray(r) ? r : []);
      setPets(Object.fromEntries((p ?? []).map((x) => [x.id, x.name])));
    } catch {
      setErr(t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (r: R) => {
    const next = !r.isDone;
    setItems((x) => x.map((y) => (y.id === r.id ? { ...y, isDone: next } : y)));
    try {
      await api('PUT', `/reminders/${r.id}`, {
        petId: r.petId ?? null, title: r.title, notes: r.notes ?? null, dueAt: r.dueAt,
        repeat: r.repeat ?? 'None', timeZoneId: r.timeZoneId ?? Intl.DateTimeFormat().resolvedOptions().timeZone, isDone: next,
      });
      load();
    } catch { load(); }
  };
  const remove = async (id: string) => {
    setItems((x) => x.filter((y) => y.id !== id));
    try { await api('DELETE', `/reminders/${id}`); } catch { load(); }
  };

  const shown = items
    .filter((r) => (tab === 'done' ? !!r.isDone : !r.isDone))
    .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)));

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.lime} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{t('rem.title')}</Txt>
      </View>
      <View style={{ marginTop: 14, marginBottom: 14 }}>
        <Segmented<'up' | 'done'> value={tab} onChange={setTab} options={[{ value: 'up', label: t('rem.up') }, { value: 'done', label: t('rem.done') }]} />
      </View>

      {loading ? <ActivityIndicator color={colors.ink} /> : err ? (
        <><ErrorBanner message={err} /><Btn label={t('common.retry')} variant="outline" onPress={load} /></>
      ) : shown.length === 0 ? <Txt variant="muted">{t('rem.empty')}</Txt> : shown.map((r) => (
        <Card key={r.id} shadow style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: colors.lilac, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bold" style={{ fontSize: 16, textDecorationLine: r.isDone ? 'line-through' : 'none' }} numberOfLines={1}>{r.title}</Txt>
            <Txt variant="muted" style={{ fontSize: 13 }}>
              {[r.petId ? pets[r.petId] : r.petName, fmtDateTime(r.dueAt, lang), r.repeat && r.repeat !== 'None' ? t(`rem.r.${r.repeat}` as any) : null].filter(Boolean).join(' · ')}
            </Txt>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={r.isDone ? t('rem.undo') : t('rem.done0')} onPress={() => toggle(r)}
            style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: colors.ink, backgroundColor: r.isDone ? colors.lime : colors.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={20} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('pets.delete')} onPress={() => remove(r.id)} style={{ padding: 4 }}>
            <Txt variant="small" style={{ color: colors.danger, fontSize: 18 }}>×</Txt>
          </Pressable>
        </Card>
      ))}

      <Txt variant="muted" style={{ fontSize: 12, textAlign: 'center', marginVertical: 8 }}>{t('rem.note')}</Txt>
      <Btn label={t('rem.new')} onPress={() => navigation.navigate('NewReminder')} />
    </ScreenScroll>
  );
}
