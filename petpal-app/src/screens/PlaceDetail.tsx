import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { useLocation } from '../location';
import { api, ApiError } from '../api';
import { colors, fonts } from '../theme';
import { Icon } from '../icons';
import { BackButton, Btn, Card, ErrorBanner, ScreenScroll, Txt } from '../ui';
import { ReviewList, Stars } from '../reviews';
import type { Paged, PlaceDetailT, PlaceSummary, Review } from '../types';
import type { RootStackParamList } from '../navigation';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const tint: Record<string, string> = { Shop: colors.lilac, DogPark: colors.lime, Vet: colors.coral, EmergencyVet: colors.coral };

export default function PlaceDetail({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'PlaceDetail'>) {
  const { id } = route.params;
  const { t } = useI18n();
  const { coords } = useLocation();
  const [place, setPlace] = useState<PlaceDetailT | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fav, setFav] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [p, r, f] = await Promise.all([
        api<PlaceDetailT>('GET', `/places/${id}`),
        api<Paged<Review>>('GET', '/reviews', undefined, { query: { targetType: 'Place', targetId: id, pageSize: 50 } }).catch(() => null),
        api<PlaceSummary[]>('GET', '/favorites', undefined, { query: { lat: coords.latitude, lng: coords.longitude } }).catch(() => [] as PlaceSummary[]),
      ]);
      setPlace(p);
      setReviews(r?.items ?? []);
      setFav(Array.isArray(f) && f.some((x) => x.id === id));
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('place.notFound'));
    } finally {
      setLoading(false);
    }
  }, [id, coords.latitude, coords.longitude, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleFav = async () => {
    const next = !fav;
    setFav(next);
    try {
      await api(next ? 'PUT' : 'DELETE', `/favorites/${id}`);
    } catch {
      setFav(!next);
    }
  };

  const hours = (day: string) => {
    const h = place?.workingHours?.find((x) => x.day === day);
    return h ? `${h.opens.slice(0, 5)} – ${h.closes.slice(0, 5)}` : t('place.closed');
  };
  const todayName = DAYS[(new Date().getDay() + 6) % 7];

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton color={colors.lilac} onPress={() => navigation.goBack()} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fav ? t('place.unsave') : t('place.save')}
          onPress={toggleFav}
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.ink, backgroundColor: fav ? colors.coral : colors.white, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="heart" fill={fav ? colors.ink : 'none'} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: 30 }} />
      ) : err || !place ? (
        <View style={{ marginTop: 16 }}>
          <ErrorBanner message={err} />
          <Btn label={t('common.retry')} variant="outline" onPress={load} />
        </View>
      ) : (
        <>
          <Card bg={tint[place.type] ?? colors.lilac} shadow style={{ marginTop: 16 }}>
            <Txt variant="display" style={{ fontSize: 30, lineHeight: 34 }}>{place.name}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {[place.type === 'EmergencyVet' ? t('pf.t.EmergencyVet') : place.type === 'DogPark' ? t('seg.DogParks') : place.type === 'Vet' ? t('seg.Vets') : t('seg.Shops'), ...place.servesPetTypes.map((p) => t(`pets.${p}` as any))].map((x) => (
                <View key={x} style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white }}>
                  <Txt variant="small" style={{ fontFamily: fonts.bold, fontSize: 12 }}>{x}</Txt>
                </View>
              ))}
              {place.isOpen24h ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.lime }}>
                  <Txt variant="small" style={{ fontFamily: fonts.bold, fontSize: 12 }}>{t('place.open24')}</Txt>
                </View>
              ) : null}
            </View>
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Stars value={place.avgRating ?? 0} size={18} />
            <Txt variant="bold">{place.avgRating != null ? place.avgRating.toFixed(1) : t('place.new')}</Txt>
            <Txt variant="muted" style={{ fontSize: 13 }}>· {place.reviewCount} {t('place.reviewsN')}</Txt>
          </View>

          <Card style={{ marginTop: 14, gap: 10 }}>
            {[place.address && `${place.address}${place.city ? ', ' + place.city : ''}`, place.phone, place.websiteUrl].filter(Boolean).length === 0 ? (
              <Txt variant="muted">{place.city ?? ''}</Txt>
            ) : null}
            {place.address ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Icon name="pin" size={20} />
                <Txt style={{ flex: 1, fontSize: 15 }}>{place.address}{place.city ? `, ${place.city}` : ''}</Txt>
              </View>
            ) : null}
            {place.phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${place.phone}`)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Icon name="user" size={20} />
                <Txt style={{ flex: 1, fontSize: 15 }}>{place.phone}</Txt>
              </Pressable>
            ) : null}
            {place.websiteUrl ? (
              <Pressable onPress={() => Linking.openURL(place.websiteUrl!)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Icon name="map" size={20} />
                <Txt style={{ flex: 1, fontSize: 15, textDecorationLine: 'underline' }} numberOfLines={1}>{place.websiteUrl.replace(/^https?:\/\//, '')}</Txt>
              </Pressable>
            ) : null}
            {place.description ? <Txt variant="muted" style={{ fontSize: 14 }}>{place.description}</Txt> : null}
          </Card>

          {place.workingHours?.length > 0 || place.isOpen24h ? (
            <Card style={{ marginTop: 14 }}>
              <Txt variant="display" style={{ fontSize: 18, letterSpacing: 0, marginBottom: 6 }}>{t('place.hours')}</Txt>
              {place.isOpen24h ? (
                <Txt>{t('place.open24')}</Txt>
              ) : (
                DAYS.map((d) => (
                  <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Txt style={{ fontFamily: d === todayName ? fonts.bold : fonts.medium, fontSize: 14 }}>{t(`day.${d}` as any)}</Txt>
                    <Txt style={{ fontFamily: d === todayName ? fonts.bold : fonts.medium, fontSize: 14 }}>{hours(d)}</Txt>
                  </View>
                ))
              )}
            </Card>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
            <Txt variant="display" style={{ fontSize: 20, letterSpacing: 0 }}>{t('place.reviews')}</Txt>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('WriteReview', { targetType: 'Place', targetId: place.id, name: place.name })}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.lime }}
            >
              <Txt variant="small" style={{ fontFamily: fonts.bold }}>{t('place.write')}</Txt>
            </Pressable>
          </View>
          <ReviewList items={reviews} onChanged={load} name={place.name} />
          <View style={{ marginTop: 20 }}>
            <Btn label={t('place.map')} variant="outline" onPress={() => (navigation as any).navigate('Main', { screen: 'MapTab', params: { focusId: place.id, ts: Date.now() } })} />
          </View>
        </>
      )}
    </ScreenScroll>
  );
}
