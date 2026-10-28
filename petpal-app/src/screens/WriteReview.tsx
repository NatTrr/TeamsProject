import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { api, ApiError } from '../api';
import { colors, fonts } from '../theme';
import { Icon } from '../icons';
import { BackButton, Btn, Card, ErrorBanner, ScreenScroll, Txt } from '../ui';
import type { RootStackParamList } from '../navigation';

export default function WriteReview({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'WriteReview'>) {
  const { targetType, targetId, name, reviewId } = route.params;
  const { t } = useI18n();
  const [rating, setRating] = useState(route.params.rating ?? 0);
  const [comment, setComment] = useState(route.params.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const post = async () => {
    if (rating < 1) return setErr(t('review.pick'));
    setBusy(true);
    setErr(null);
    try {
      if (reviewId) await api('PUT', `/reviews/${reviewId}`, { rating, comment: comment.trim() || null });
      else await api('POST', '/reviews', { targetType, targetId, rating, comment: comment.trim() || null });
      navigation.goBack();
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 ? t('review.error') : t('common.loadError'));
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.lime} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{reviewId ? t('rev.editTitle') : t('review.title')}</Txt>
      </View>

      <Card bg={colors.lilac} shadow style={{ marginTop: 18 }}>
        <Txt variant="display" style={{ fontSize: 22, letterSpacing: 0 }}>{name}</Txt>
      </Card>

      <Txt variant="bold" style={{ marginTop: 22, fontSize: 18 }}>{t('review.how')}</Txt>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${i}`} onPress={() => setRating(i)}>
            <Icon name="star" size={46} fill={i <= rating ? colors.amber : colors.white} strokeWidth={1.8} />
          </Pressable>
        ))}
      </View>
      <Txt variant="muted" style={{ marginTop: 6 }}>{rating > 0 ? `${rating} ${t('review.outOf')}` : ' '}</Txt>

      <Txt variant="bold" style={{ marginTop: 16, fontSize: 13, marginLeft: 4 }}>{t('review.text')}</Txt>
      <TextInput
        accessibilityLabel={t('review.text')}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={1000}
        style={{ marginTop: 6, minHeight: 110, textAlignVertical: 'top', borderRadius: 22, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white, padding: 16, fontFamily: fonts.medium, fontSize: 16, color: colors.ink }}
      />
      <Txt variant="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 14 }}>{t('review.hint')}</Txt>
      <ErrorBanner message={err} />
      <Btn label={reviewId ? t('rev.update') : t('review.post')} loading={busy} onPress={post} />
    </ScreenScroll>
  );
}
