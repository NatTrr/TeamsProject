import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { useAuth, PET_TYPES, PetType } from '../auth';
import { useLocation, getMyLocation } from '../location';
import { api, ApiError } from '../api';
import { colors } from '../theme';
import { petColor } from '../icons';
import { BackButton, Btn, Chip, ErrorBanner, Field, ScreenScroll, Segmented, Txt } from '../ui';
import type { RootStackParamList } from '../navigation';

export default function ReportPet({ navigation }: NativeStackScreenProps<RootStackParamList, 'ReportPet'>) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { coords } = useLocation();
  const [kind, setKind] = useState<'Lost' | 'Found'>('Lost');
  const [petType, setPetType] = useState<PetType>('Dog');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [pos, setPos] = useState<{ latitude: number; longitude: number; real: boolean }>({ ...coords, real: false });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mine = async () => setPos(await getMyLocation());

  const post = async () => {
    setErr(null);
    if (!title.trim()) return setErr(t('lf.titleReq'));
    setBusy(true);
    try {
      await api('POST', '/lostfound', {
        type: kind, petType, title: title.trim(), description: desc.trim() || null, photoUrl: null,
        latitude: pos.latitude, longitude: pos.longitude, contactPhone: phone.trim() || null,
      });
      navigation.goBack();
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('common.loadError'));
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.coral} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{t('lf.newTitle')}</Txt>
      </View>
      <View style={{ marginVertical: 16 }}>
        <Segmented<'Lost' | 'Found'> value={kind} onChange={setKind} options={[{ value: 'Lost', label: t('lf.iLost') }, { value: 'Found', label: t('lf.iFound') }]} />
      </View>
      <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('lf.animal')}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {PET_TYPES.map((p) => <Chip key={p} label={t(`pets.${p}` as any)} color={petColor[p]} selected={petType === p} onPress={() => setPetType(p)} />)}
      </View>
      <Field label={t('lf.fTitle')} value={title} onChangeText={setTitle} />
      <Field label={t('lf.desc')} value={desc} onChangeText={setDesc} multiline style={{ height: 96, borderRadius: 22, paddingTop: 14, textAlignVertical: 'top' }} />
      <Txt variant="bold" style={{ fontSize: 13, marginLeft: 4, marginBottom: 6 }}>{t('lf.where')}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Chip label={t('lf.useMine')} selected={pos.real} onPress={mine} />
        <Txt variant="muted" style={{ fontSize: 13, flex: 1 }}>{pos.real ? t('lf.usingMine') : t('lf.usingCentre')}</Txt>
      </View>
      <Field label={t('lf.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <ErrorBanner message={err} />
      <Btn label={t('lf.post')} loading={busy} onPress={post} />
    </ScreenScroll>
  );
}
