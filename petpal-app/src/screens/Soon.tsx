import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { BackButton, ScreenScroll, Txt } from '../ui';
import type { HomeStackParamList } from '../navigation';

// Temporary screen for features that are built in the next steps.
export default function Soon({ navigation, route }: NativeStackScreenProps<HomeStackParamList, 'Soon'>) {
  const { t } = useI18n();
  return (
    <ScreenScroll>
      <BackButton onPress={() => navigation.goBack()} />
      <Txt variant="display" style={{ marginTop: 18 }}>
        {route.params?.title ?? ''}
      </Txt>
      <Txt variant="muted" style={{ marginTop: 8 }}>
        {t('soon.body')}
      </Txt>
    </ScreenScroll>
  );
}

// Used as a tab screen (Map, Saved, My places) until it is built.
export function SoonTab({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <ScreenScroll>
      <Txt variant="display">{title}</Txt>
      <Txt variant="muted" style={{ marginTop: 8 }}>
        {t('soon.body')}
      </Txt>
    </ScreenScroll>
  );
}
