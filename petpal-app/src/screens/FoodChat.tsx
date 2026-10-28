import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { PET_TYPES, PetType } from '../auth';
import { api, ApiError } from '../api';
import { colors, fonts } from '../theme';
import { Icon, PetFace, petColor } from '../icons';
import { BackButton, Btn, Txt } from '../ui';
import type { HomeStackParamList } from '../navigation';

type Result = {
  verdict: string;
  source: string;
  explanation: string;
  showVetWarning?: boolean;
  matchedFood?: string | null;
};
type NewMsg = { from: 'me'; text: string } | { from: 'bot'; result?: Result; error?: string };
type Msg = NewMsg & { id: number };

function verdictInfo(v: string) {
  const k = (v ?? '').toLowerCase();
  if (k.includes('toxic') || k.includes('danger') || k.includes('unsafe')) return { key: 'food.v.toxic', bg: colors.coral } as const;
  if (k.includes('caution') || k.includes('risk') || k.includes('moderation')) return { key: 'food.v.caution', bg: colors.amber } as const;
  if (k.includes('safe')) return { key: 'food.v.safe', bg: colors.lime } as const;
  return { key: 'food.v.unknown', bg: colors.lilac } as const;
}

export default function FoodChat({ navigation, route }: NativeStackScreenProps<HomeStackParamList, 'FoodChat'>) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState<PetType>(route.params.petType);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scroll = useRef<ScrollView>(null);
  const nextId = useRef(1);

  const push = (m: NewMsg) => {
    const full = { ...m, id: nextId.current++ } as Msg;
    setMsgs((x) => [...x, full]);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  const send = async () => {
    const food = text.trim();
    if (!food || busy) return;
    setText('');
    push({ from: 'me', text: food });
    setBusy(true);
    try {
      const r = await api<Result>('POST', '/foodcheck', { petType: pet, food });
      push({ from: 'bot', result: r });
    } catch (e) {
      push({ from: 'bot', error: e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('food.error') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <BackButton color={colors.lime} onPress={() => navigation.goBack()} />
          <Txt variant="display" style={{ fontSize: 28 }}>{t('food.screen')}</Txt>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
          {PET_TYPES.map((p) => {
            const on = p === pet;
            return (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setPet(p)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: on ? petColor[p] : colors.white }}
              >
                <PetFace type={p} size={24} />
                <Txt variant="small" style={{ fontFamily: fonts.bold, fontSize: 14 }}>{t(`pets.${p}` as any)}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 10, backgroundColor: colors.amber, borderWidth: 2, borderColor: colors.ink, borderRadius: 16 }}>
          <Icon name="bell" size={18} />
          <Txt variant="small" style={{ flex: 1, fontFamily: fonts.bold, fontSize: 12.5 }}>{t('food.ai')}</Txt>
        </View>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
        {msgs.length === 0 ? (
          <Txt variant="muted" style={{ textAlign: 'center', marginTop: 24 }}>{t('food.empty')}</Txt>
        ) : null}
        {msgs.map((m) =>
          m.from === 'me' ? (
            <View key={m.id} style={{ alignItems: 'flex-end', marginTop: 12 }}>
              <View style={{ maxWidth: 260, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderBottomRightRadius: 6, backgroundColor: colors.ink }}>
                <Txt style={{ color: colors.cream, fontSize: 15 }}>{m.text}</Txt>
              </View>
            </View>
          ) : m.error ? (
            <View key={m.id} style={{ marginTop: 10, padding: 12, borderRadius: 18, borderWidth: 2, borderColor: colors.danger, backgroundColor: '#FDE3DF' }}>
              <Txt style={{ color: colors.danger, fontSize: 14 }}>{m.error}</Txt>
            </View>
          ) : m.result ? (
            <ResultCard key={m.id} r={m.result} onVet={() => navigation.navigate('Animal', { petType: pet, tab: 'Vets' })} />
          ) : null,
        )}
        {busy ? <ActivityIndicator color={colors.ink} style={{ marginTop: 14, alignSelf: 'flex-start' }} /> : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 }}>
        <Txt variant="muted" style={{ fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{t('food.callvet')}</Txt>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput
            accessibilityLabel={t('food.placeholder')}
            placeholder={t('food.placeholder')}
            placeholderTextColor="#7C9486"
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
            style={{ flex: 1, minWidth: 0, height: 54, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white, paddingHorizontal: 20, fontFamily: fonts.medium, fontSize: 16, color: colors.ink }}
          />
          <View style={{ borderRadius: 27, backgroundColor: colors.coral, paddingBottom: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              onPress={send}
              disabled={busy}
              style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
            >
              <Icon name="chevron" color={colors.lime} />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function ResultCard({ r, onVet }: { r: Result; onVet: () => void }) {
  const { t } = useI18n();
  const v = verdictInfo(r.verdict);
  const fromDb = (r.source ?? '').toLowerCase().includes('database');
  return (
    <View style={{ marginTop: 10, backgroundColor: colors.ink, borderRadius: 22, paddingBottom: 4 }}>
      <View style={{ backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, borderRadius: 22, padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: v.bg }}>
            <Txt variant="small" style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 0.4 }}>{t(v.key)}</Txt>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: fromDb ? colors.line : colors.lilac }}>
            <Txt variant="small" style={{ fontFamily: fonts.bold, fontSize: 12 }}>{fromDb ? t('food.src.db') : t('food.src.ai')}</Txt>
          </View>
        </View>
        {r.matchedFood ? <Txt variant="bold" style={{ marginTop: 10 }}>{r.matchedFood}</Txt> : null}
        <Txt style={{ marginTop: 6, fontSize: 15, lineHeight: 22 }}>{r.explanation}</Txt>
        {r.showVetWarning ? <Btn label={t('food.findvet')} onPress={onVet} height={44} style={{ marginTop: 12 }} /> : null}
      </View>
    </View>
  );
}
