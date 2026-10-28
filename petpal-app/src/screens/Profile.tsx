import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { api, ApiError } from '../api';
import { Btn, Card, ErrorBanner, Field, ScreenScroll, Segmented, Txt } from '../ui';
import { Icon, IconName } from '../icons';
import { colors } from '../theme';

export default function Profile() {
  const { t, lang, setLang } = useI18n();
  const { user, isShopOwner, logout, refreshMe } = useAuth();
  const nav = useNavigation<any>();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await api('PUT', '/me', { fullName: name.trim(), phone: phone.trim(), city: city.trim() });
      await refreshMe();
      setEditing(false);
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('common.loadError'));
    } finally { setBusy(false); }
  };

  const rows: { icon: IconName; label: string; to: string }[] = isShopOwner
    ? []
    : [
        { icon: 'heart', label: t('prof.pets'), to: 'MyPets' },
        { icon: 'bell', label: t('prof.rem'), to: 'Reminders' },
        { icon: 'search', label: t('prof.lf'), to: 'LostFound' },
        { icon: 'pin', label: t('prof.req'), to: 'MyRequests' },
        { icon: 'user', label: t('prof.walker'), to: 'WalkerDash' },
      ];

  return (
    <ScreenScroll>
      <Txt variant="display">{t('tab.profile')}</Txt>
      <Card bg={colors.amber} shadow style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="display" style={{ fontSize: 26 }}>{user?.fullName?.[0]?.toUpperCase() ?? '?'}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="display" style={{ fontSize: 20 }} numberOfLines={1}>{user?.fullName}</Txt>
            <Txt variant="small" numberOfLines={1}>{user?.email}</Txt>
            <Txt variant="small" style={{ marginTop: 2 }}>{isShopOwner ? t('prof.shop') : t('prof.owner')}</Txt>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('prof.edit')} onPress={() => setEditing(!editing)}
            style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="edit" size={20} />
          </Pressable>
        </View>
        {editing ? (
          <View style={{ marginTop: 14 }}>
            <Field label={t('prof.name')} value={name} onChangeText={setName} />
            <Field label={t('prof.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label={t('prof.city')} value={city} onChangeText={setCity} />
            <ErrorBanner message={err} />
            <Btn label={t('prof.save')} loading={busy} onPress={save} height={46} />
          </View>
        ) : null}
      </Card>

      {rows.map((r) => (
        <Pressable key={r.to} accessibilityRole="button" onPress={() => nav.navigate(r.to)} style={{ marginTop: 12 }}>
          <Card shadow style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
            <Icon name={r.icon} />
            <Txt variant="bold" style={{ flex: 1 }}>{r.label}</Txt>
            <Icon name="chevron" />
          </Card>
        </Pressable>
      ))}

      <Card style={{ marginTop: 16 }}>
        <Txt variant="bold" style={{ marginBottom: 8 }}>{t('profile.language')}</Txt>
        <Segmented<'en' | 'mk'> value={lang} onChange={setLang} options={[{ value: 'en', label: 'English' }, { value: 'mk', label: 'Македонски' }]} />
      </Card>

      <View style={{ marginTop: 20 }}><Btn label={t('home.logout')} variant="coral" onPress={logout} /></View>
    </ScreenScroll>
  );
}
