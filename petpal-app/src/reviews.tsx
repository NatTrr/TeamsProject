import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './auth';
import { api } from './api';
import { colors, fonts } from './theme';
import { Icon } from './icons';
import { Txt } from './ui';
import { useI18n } from './i18n';
import type { Review } from './types';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} fill={i <= Math.round(value) ? colors.coral : 'none'} strokeWidth={2} />
      ))}
    </View>
  );
}

export function ReviewList({ items, onChanged, name }: { items: Review[]; onChanged?: () => void; name?: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigation<any>();
  const [confirm, setConfirm] = useState<string | null>(null);
  const remove = async (id: string) => {
    if (confirm !== id) return setConfirm(id);
    setConfirm(null);
    try { await api('DELETE', `/reviews/${id}`); } catch {}
    onChanged?.();
  };
  const pill = (label: string, bg: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: bg }}>
      <Txt variant="small" style={{ fontFamily: fonts.bold, fontSize: 12 }}>{label}</Txt>
    </Pressable>
  );
  if (items.length === 0) return <Txt variant="muted">{t('place.noReviews')}</Txt>;
  return (
    <View style={{ gap: 12 }}>
      {items.map((r) => (
        <View key={r.id} style={{ backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, borderRadius: 22, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lilac, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="bold" style={{ fontSize: 15 }}>{r.userName?.[0]?.toUpperCase() ?? '?'}</Txt>
            </View>
            <Txt variant="bold" style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>{r.userName}</Txt>
            <Stars value={r.rating} size={14} />
          </View>
          {r.comment ? <Txt style={{ marginTop: 8, fontSize: 14, lineHeight: 20 }}>{r.comment}</Txt> : null}
          {user && r.userId === user.id ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {pill(t('rev.edit'), colors.lime, () => nav.navigate('WriteReview', { targetType: r.targetType, targetId: r.targetId, name: name ?? '', reviewId: r.id, rating: r.rating, comment: r.comment }))}
              {pill(confirm === r.id ? t('rev.confirm') : t('rev.delete'), confirm === r.id ? colors.coral : colors.white, () => remove(r.id))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
