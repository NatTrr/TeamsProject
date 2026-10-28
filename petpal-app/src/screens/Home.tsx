import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { useAuth, PET_TYPES, PetType } from '../auth';
import { useLocation } from '../location';
import { api } from '../api';
import { colors } from '../theme';
import { Icon, PetFace, petColor } from '../icons';
import { Card, ScreenScroll, Txt } from '../ui';
import type { ReminderItem } from '../types';
import type { HomeStackParamList } from '../navigation';

export default function Home({ navigation }: NativeStackScreenProps<HomeStackParamList, 'HomeMain'>) {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const { coords, isReal, toggle } = useLocation();
  const [rem, setRem] = useState<ReminderItem | null>(null);
  const [lf, setLf] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let off = false;
      api<ReminderItem[]>('GET', '/reminders')
        .then((r) => {
          if (off) return;
          const next = (Array.isArray(r) ? r : [])
            .filter((x) => !x.isDone)
            .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))[0];
          setRem(next ?? null);
        })
        .catch(() => !off && setRem(null));
      api<{ total: number }>('GET', '/lostfound', undefined, {
        query: { lat: coords.latitude, lng: coords.longitude, radiusKm: 10 },
      })
        .then((r) => !off && setLf(r?.total ?? 0))
        .catch(() => !off && setLf(null));
      return () => {
        off = true;
      };
    }, [coords.latitude, coords.longitude]),
  );

  const first = (user?.fullName ?? '').split(' ')[0];

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.amber, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="display" style={{ fontSize: 20 }}>{first[0]?.toUpperCase() ?? '?'}</Txt>
        </View>
        <Txt variant="bold" style={{ flex: 1, fontSize: 18 }} numberOfLines={1}>
          {t('home.hi')}, {first}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('loc.mine')}
          onPress={toggle}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 36, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: isReal ? colors.lime : colors.white }}
        >
          <Icon name="pin" size={16} />
          <Txt variant="small" style={{ fontFamily: 'Rubik_700Bold' }}>{isReal ? t('loc.mine') : t('loc.center')}</Txt>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Language"
          onPress={() => setLang(lang === 'en' ? 'mk' : 'en')}
          style={{ height: 36, paddingHorizontal: 10, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white, justifyContent: 'center' }}
        >
          <Txt variant="small" style={{ fontFamily: 'Rubik_700Bold' }}>{lang === 'en' ? 'EN' : 'МК'}</Txt>
        </Pressable>
      </View>

      <Txt variant="display" style={{ marginTop: 20, fontSize: 30, lineHeight: 34 }}>{t('home.who')}</Txt>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        {PET_TYPES.map((p: PetType) => (
          <View key={p} style={{ width: '47.5%', backgroundColor: colors.ink, borderRadius: 24, paddingBottom: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(`pets.${p}` as any)}
              onPress={() => navigation.navigate('Animal', { petType: p })}
              style={({ pressed }) => ({ backgroundColor: petColor[p], borderWidth: 2, borderColor: colors.ink, borderRadius: 24, padding: 14, minHeight: 170, transform: [{ translateY: pressed ? 3 : 0 }] })}
            >
              <PetFace type={p} size={72} />
              <Txt variant="display" style={{ fontSize: 22, marginTop: 8 }}>{t(`pets.${p}` as any)}</Txt>
              <Txt variant="small" style={{ marginTop: 2, opacity: 0.85 }}>{t(`pets.sub.${p}` as any)}</Txt>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable onPress={() => (navigation as any).navigate('Reminders')} accessibilityRole="button" style={{ marginTop: 18 }}>
        <Card shadow bg={colors.white} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="bell" />
          <View style={{ flex: 1 }}>
            <Txt variant="bold" numberOfLines={1}>{rem ? rem.title : t('rem.none')}</Txt>
            <Txt variant="muted" style={{ fontSize: 13 }}>
              {rem ? new Date(rem.dueAt).toLocaleString() : t('rem.noneSub')}
            </Txt>
          </View>
          <Icon name="chevron" />
        </Card>
      </Pressable>

      <Pressable onPress={() => (navigation as any).navigate('LostFound')} accessibilityRole="button" style={{ marginTop: 14 }}>
        <Card shadow bg={colors.lilac} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="search" />
          <View style={{ flex: 1 }}>
            <Txt variant="bold">{t('lf.title')}</Txt>
            <Txt variant="small">{lf ? `${lf} ${t('lf.reports')}` : t('lf.none')}</Txt>
          </View>
          <Icon name="chevron" />
        </Card>
      </Pressable>
    </ScreenScroll>
  );
}
