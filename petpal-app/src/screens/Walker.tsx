import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { api, ApiError } from '../api';
import { colors, fonts } from '../theme';
import { Icon } from '../icons';
import { BackButton, Btn, Card, Chip, ErrorBanner, ScreenScroll, Txt } from '../ui';
import { ReviewList, Stars } from '../reviews';
import type { Paged, Review, WalkerSummary } from '../types';
import type { RootStackParamList } from '../navigation';

type Pet = { id: string; name: string; type: string };

export default function Walker({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Walker'>) {
  const { id } = route.params;
  const { t } = useI18n();
  const [w, setW] = useState<WalkerSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isMine, setIsMine] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoadErr(null);
    try {
      const [x, r] = await Promise.all([
        api<WalkerSummary>('GET', `/walkers/${id}`),
        api<Paged<Review>>('GET', '/reviews', undefined, { query: { targetType: 'Walker', targetId: id, pageSize: 50 } }).catch(() => null),
      ]);
      setW(x);
      api<{ id?: string }>('GET', '/walkers/me').then((m) => setIsMine(!!m && m.id === id)).catch(() => setIsMine(false));
      setReviews(r?.items ?? []);
    } catch (e) {
      setLoadErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    api<Pet[]>('GET', '/pets')
      .then((p) => {
        const dogs = (p ?? []).filter((x) => x.type === 'Dog');
        const list = dogs.length ? dogs : p ?? [];
        setPets(list);
        if (list[0]) setPetId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const send = async () => {
    setErr(null);
    let preferredTime: string | null = null;
    if (when.trim()) {
      const d = new Date(when.trim().replace(' ', 'T'));
      if (isNaN(d.getTime())) return setErr(t('walker.timeBad'));
      preferredTime = d.toISOString();
    }
    setBusy(true);
    try {
      await api('POST', `/walkers/${id}/requests`, { petId, message: message.trim() || null, preferredTime });
      setSent(true);
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('walker.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.amber} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{t('walker.title')}</Txt>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: 30 }} />
      ) : loadErr || !w ? (
        <View style={{ marginTop: 16 }}>
          <ErrorBanner message={loadErr} />
          <Btn label={t('common.retry')} variant="outline" onPress={load} />
        </View>
      ) : (
        <>
          <Card bg={colors.amber} shadow style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="display" style={{ fontSize: 24 }}>{w.name[0]?.toUpperCase()}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="display" style={{ fontSize: 22, letterSpacing: 0 }} numberOfLines={1}>{w.name}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Stars value={w.avgRating ?? 0} size={14} />
                <Txt variant="small">{w.avgRating != null ? w.avgRating.toFixed(1) : t('place.new')} ({w.reviewCount})</Txt>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="display" style={{ fontSize: 20, letterSpacing: 0 }}>{Math.round(w.pricePerWalk)} ден</Txt>
              <Txt variant="small">{t('walker.perWalk')}</Txt>
            </View>
          </Card>

          {w.bio ? <Txt style={{ marginTop: 14, fontSize: 15, lineHeight: 22 }}>{w.bio}</Txt> : null}

          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: colors.line }}>
            <Icon name="pin" size={20} />
            <Txt variant="small" style={{ flex: 1, lineHeight: 18 }}>{t('walker.privacy')}</Txt>
          </View>

          <Txt variant="display" style={{ fontSize: 20, letterSpacing: 0, marginTop: 22, marginBottom: 8 }}>{t('walker.form')}</Txt>

          {isMine ? (
            <Card bg={colors.lilac} shadow>
              <Txt variant="bold">{t('walker.own')}</Txt>
            </Card>
          ) : sent ? (
            <Card bg={colors.lime} shadow>
              <Txt variant="bold">{t('walker.sent')}</Txt>
            </Card>
          ) : (
            <>
              {pets.length > 0 ? (
                <>
                  <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('walker.which')}</Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {pets.map((p) => (
                      <Chip key={p.id} label={p.name} selected={petId === p.id} onPress={() => setPetId(p.id)} />
                    ))}
                  </View>
                </>
              ) : null}
              <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('walker.message')}</Txt>
              <TextInput
                accessibilityLabel={t('walker.message')}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                style={{ minHeight: 90, textAlignVertical: 'top', borderRadius: 22, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white, padding: 16, fontFamily: fonts.medium, fontSize: 16, color: colors.ink }}
              />
              <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginTop: 12, marginBottom: 6 }}>{t('walker.time')}</Txt>
              <TextInput
                accessibilityLabel={t('walker.time')}
                value={when}
                onChangeText={setWhen}
                placeholder="2026-10-17 18:00"
                placeholderTextColor="#7C9486"
                style={{ height: 52, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white, paddingHorizontal: 20, fontFamily: fonts.medium, fontSize: 16, color: colors.ink, marginBottom: 14 }}
              />
              <ErrorBanner message={err} />
              <Btn label={t('walker.send')} loading={busy} onPress={send} />
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
            <Txt variant="display" style={{ fontSize: 20, letterSpacing: 0 }}>{t('walker.reviews')}</Txt>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('WriteReview', { targetType: 'Walker', targetId: w.id, name: w.name })}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.lime }}
            >
              <Txt variant="small" style={{ fontFamily: fonts.bold }}>{t('place.write')}</Txt>
            </Pressable>
          </View>
          <ReviewList items={reviews} onChanged={load} name={w.name} />
        </>
      )}
    </ScreenScroll>
  );
}
