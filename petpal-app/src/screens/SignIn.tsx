import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { ApiError } from '../api';
import { BackButton, Btn, Card, ErrorBanner, Field, ScreenScroll, Txt } from '../ui';
import type { RootStackParamList } from '../navigation';

function Arrow() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export default function SignIn({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignIn'>) {
  const { t, lang, setLang } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});

  async function submit() {
    const fe: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) fe.email = t('err.email');
    if (!password) fe.password = t('err.required');
    setFieldErr(fe);
    setError(null);
    if (fe.email || fe.password) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
      // The navigator switches to the app automatically once the user is set.
    } catch (e) {
      setError(e instanceof ApiError ? (e.status === 401 ? t('signin.wrong') : e.message) : String(e));
      setBusy(false);
    }
  }

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Pressable
          accessibilityRole="button"
          onPress={() => setLang(lang === 'en' ? 'mk' : 'en')}
          style={{
            height: 40,
            paddingHorizontal: 14,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: colors.ink,
            backgroundColor: colors.white,
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.ink }}>{lang === 'en' ? 'EN · МК' : 'МК · EN'}</Text>
        </Pressable>
      </View>

      <Txt variant="display" style={{ marginTop: 22, fontSize: 36 }}>
        {t('signin.title')}
      </Txt>
      <Txt variant="muted" style={{ marginTop: 6, marginBottom: 22 }}>
        {t('signin.subtitle')}
      </Txt>

      <ErrorBanner message={error} />
      <Field
        label={t('signin.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        error={fieldErr.email}
      />
      <Field
        label={t('signin.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        onSubmitEditing={submit}
        error={fieldErr.password}
      />
      <Btn label={t('signin.submit')} onPress={submit} loading={busy} style={{ marginTop: 6 }} />

      <Txt variant="bold" style={{ marginTop: 28, marginBottom: 10, textAlign: 'center' }}>
        {t('signin.newHere')}
      </Txt>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('OwnerSignup')}>
        <Card bg={colors.lilac} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bold" style={{ fontSize: 18 }}>
              {t('signin.ownerCard')}
            </Txt>
            <Txt variant="small">{t('signin.ownerCardSub')}</Txt>
          </View>
          <Arrow />
        </Card>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ShopSignup')} style={{ marginTop: 12 }}>
        <Card bg={colors.amber} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bold" style={{ fontSize: 18 }}>
              {t('signin.shopCard')}
            </Txt>
            <Txt variant="small">{t('signin.shopCardSub')}</Txt>
          </View>
          <Arrow />
        </Card>
      </Pressable>
    </ScreenScroll>
  );
}
