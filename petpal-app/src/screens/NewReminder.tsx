import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { api, ApiError } from '../api';
import { colors } from '../theme';
import { BackButton, Btn, Chip, ErrorBanner, Field, ScreenScroll, Txt } from '../ui';
import { parseLocal } from '../format';
import type { RootStackParamList } from '../navigation';

const CATS = ['vaccine', 'flea', 'vet', 'groom', 'other'] as const;
const REPEATS = ['None', 'Weekly', 'Monthly', 'Yearly'] as const;

export default function NewReminder({ navigation }: NativeStackScreenProps<RootStackParamList, 'NewReminder'>) {
  const { t } = useI18n();
  const [pets, setPets] = useState<{ id: string; name: string }[]>([]);
  const [petId, setPetId] = useState<string | null>(null);
  const [cat, setCat] = useState<(typeof CATS)[number] | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [repeat, setRepeat] = useState<(typeof REPEATS)[number]>('None');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ id: string; name: string }[]>('GET', '/pets').then((p) => { setPets(p ?? []); if (p?.[0]) setPetId(p[0].id); }).catch(() => {});
  }, []);

  const pick = (c: (typeof CATS)[number]) => {
    setCat(c);
    if (c !== 'other') setTitle(t(`rem.c.${c}` as any));
  };

  const save = async () => {
    setErr(null);
    if (!title.trim()) return setErr(t('rem.titleReq'));
    const d = parseLocal(date, time);
    if (!d) return setErr(t('rem.dateBad'));
    setBusy(true);
    try {
      await api('POST', '/reminders', {
        petId, title: title.trim(), notes: notes.trim() || null, dueAt: d.toISOString(), repeat,
        timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone, isDone: false,
      });
      navigation.goBack();
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('common.loadError'));
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.lime} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{t('rem.newTitle')}</Txt>
      </View>

      <Txt variant="bold" style={{ marginTop: 18, marginBottom: 8 }}>{t('rem.what')}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {CATS.map((c) => <Chip key={c} label={t(`rem.c.${c}` as any)} selected={cat === c} onPress={() => pick(c)} />)}
      </View>
      <Field label={t('rem.fTitle')} value={title} onChangeText={setTitle} />

      {pets.length > 0 ? (
        <>
          <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('rem.pet')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {pets.map((p) => <Chip key={p.id} label={p.name} selected={petId === p.id} onPress={() => setPetId(p.id)} />)}
          </View>
        </>
      ) : <Txt variant="muted" style={{ marginBottom: 12 }}>{t('rem.noPets')}</Txt>}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1.4 }}><Field label={t('rem.date')} value={date} onChangeText={setDate} placeholder="2026-11-01" /></View>
        <View style={{ flex: 1 }}><Field label={t('rem.time')} value={time} onChangeText={setTime} placeholder="09:00" /></View>
      </View>

      <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('rem.repeat')}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {REPEATS.map((r) => <Chip key={r} label={t(`rem.r.${r}` as any)} selected={repeat === r} onPress={() => setRepeat(r)} />)}
      </View>
      <Field label={t('rem.notes')} value={notes} onChangeText={setNotes} />
      <ErrorBanner message={err} />
      <Btn label={t('rem.save')} loading={busy} onPress={save} />
    </ScreenScroll>
  );
}
