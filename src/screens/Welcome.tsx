import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { useI18n } from '../i18n';
import { useFrame } from '../PhoneFrame';
import { Btn, Txt } from '../ui';
import { welcomeCards } from '../illustrations';
import type { RootStackParamList } from '../navigation';

function Paw({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity={opacity}>
      <Ellipse cx="6" cy="10" rx="2.2" ry="2.8" />
      <Ellipse cx="10.5" cy="6" rx="2.2" ry="2.8" />
      <Ellipse cx="15.5" cy="6" rx="2.2" ry="2.8" />
      <Ellipse cx="19" cy="10.5" rx="2.2" ry="2.8" />
      <Path d="M12.5 11c3 0 6 3.4 6 6.2 0 2-1.8 2.8-3.4 2.4-1.2-.3-1.8-.6-2.6-.6s-1.4.3-2.6.6c-1.6.4-3.4-.4-3.4-2.4 0-2.8 3-6.2 6-6.2z" />
    </Svg>
  );
}

export default function Welcome({ navigation }: NativeStackScreenProps<RootStackParamList, 'Welcome'>) {
  const { t, lang, setLang } = useI18n();
  const { width } = useFrame();

  const size = Math.min(150, (width - 56) / 2);
  const left = Math.max(14, width * 0.08);
  const right = width - left - size;
  const heroH = size * 2 + 150;
  const spots = [
    { x: left, y: 100, r: -7 },
    { x: right, y: 120, r: 6 },
    { x: left - 4, y: 100 + size + 28, r: 5 },
    { x: right + 2, y: 120 + size + 28, r: -6 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View
        style={{
          height: heroH,
          backgroundColor: colors.coral,
          borderBottomLeftRadius: 56,
          borderBottomRightRadius: 56,
          borderBottomWidth: 3,
          borderColor: colors.ink,
          overflow: 'hidden',
        }}
      >
        <View style={{ position: 'absolute', left: 24, top: 26, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paw size={20} color={colors.lime} />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: -0.5 }}>petpal</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lang === 'en' ? 'Switch to Macedonian' : 'Switch to English'}
          onPress={() => setLang(lang === 'en' ? 'mk' : 'en')}
          style={{
            position: 'absolute',
            right: 20,
            top: 26,
            height: 34,
            paddingHorizontal: 14,
            borderRadius: 17,
            borderWidth: 2,
            borderColor: colors.ink,
            backgroundColor: colors.cream,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.ink }}>{lang === 'en' ? 'EN · МК' : 'МК · EN'}</Text>
        </Pressable>

        <View style={{ position: 'absolute', left: width * 0.5 - 20, top: 66, opacity: 0.18 }}>
          <Paw size={40} color={colors.ink} />
        </View>

        {welcomeCards.map((c, i) => (
          <View
            key={c.label}
            accessible
            accessibilityRole="image"
            accessibilityLabel={c.label}
            style={{
              position: 'absolute',
              left: spots[i].x,
              top: spots[i].y,
              width: size,
              height: size,
              borderRadius: 30,
              backgroundColor: c.bg,
              overflow: 'hidden',
              transform: [{ rotate: `${spots[i].r}deg` }],
            }}
          >
            <SvgXml xml={c.xml} width={size} height={size} />
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 28, paddingTop: 26 }}>
        <Txt variant="display" style={{ fontSize: 38, lineHeight: 40 }}>
          {t('welcome.title')}
        </Txt>
        <Txt variant="muted" style={{ fontSize: 16, lineHeight: 24, marginTop: 12 }}>
          {t('welcome.subtitle')}
        </Txt>
      </View>

      <View style={{ position: 'absolute', left: 28, right: 28, bottom: 30, alignItems: 'center', gap: 12 }}>
        <Btn
          label={t('welcome.go')}
          onPress={() => navigation.navigate('SignIn')}
          style={{ alignSelf: 'stretch' }}
          height={58}
        />
        <Pressable accessibilityRole="link" onPress={() => navigation.navigate('SignIn')}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.ink, textDecorationLine: 'underline' }}>
            {t('welcome.haveAccount')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
