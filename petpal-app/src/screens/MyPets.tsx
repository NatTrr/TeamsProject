import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { PET_TYPES, PetType } from '../auth';
import { api, ApiError } from '../api';
import { colors } from '../theme';
import { PetFace, petColor } from '../icons';
import { BackButton, Btn, Card, Chip, ErrorBanner, Field, ScreenScroll, Txt } from '../ui';
import { ageYears } from '../format';
import type { RootStackParamList } from '../navigation';

type Pet = { id: string; name: string; type: PetType; breed: string | null; birthDate: string | null };

export default function MyPets({ navigation }: NativeStackScreenProps<RootStackParamList, 'MyPets'>) {
  const { t } = useI18n();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<PetType>('Dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birth, setBirth] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<Pet[]>('GET', '/pets');
      setPets(Array.isArray(r) ? r : []);
    } catch {
      setErr(t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    setErr(null);
    if (!name.trim()) return setErr(t('pets.nameReq'));
    if (birth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(birth.trim())) return setErr(t('pets.dateBad'));
    setBusy(true);
    try {
      await api('POST', '/pets', { type, name: name.trim(), breed: breed.trim() || null, birthDate: birth.trim() || null, photoUrl: null });
      setName(''); setBreed(''); setBirth('');
      await load();
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 && e.message ? e.message : t('common.loadError'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setPets((x) => x.filter((p) => p.id !== id));
    try { await api('DELETE', `/pets/${id}`); } catch { load(); }
  };

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton color={colors.lilac} onPress={() => navigation.goBack()} />
        <Txt variant="display" style={{ fontSize: 28 }}>{t('prof.pets')}</Txt>
      </View>

      <View style={{ marginTop: 16, gap: 12 }}>
        {loading ? <ActivityIndicator color={colors.ink} /> : pets.length === 0 ? <Txt variant="muted">{t('pets.none')}</Txt> : null}
        {pets.map((p) => {
          const a = ageYears(p.birthDate);
          return (
            <Card key={p.id} shadow style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: petColor[p.type], borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                <PetFace type={p.type} size={38} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bold" style={{ fontSize: 17 }}>{p.name}</Txt>
                <Txt variant="muted" style={{ fontSize: 13 }}>
                  {[t(`pets.${p.type}` as any), p.breed, a != null ? `${a} ${t('pets.years')}` : null].filter(Boolean).join(' · ')}
                </Txt>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('pets.delete')} onPress={() => remove(p.id)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                <Txt variant="small" style={{ color: colors.danger }}>{t('pets.delete')}</Txt>
              </Pressable>
            </Card>
          );
        })}
      </View>

      <Txt variant="display" style={{ fontSize: 22, letterSpacing: 0, marginTop: 24, marginBottom: 10 }}>{t('pets.add')}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {PET_TYPES.map((p) => <Chip key={p} label={t(`pets.${p}` as any)} selected={type === p} color={petColor[p]} onPress={() => setType(p)} />)}
      </View>
      <Field label={t('pets.name')} value={name} onChangeText={setName} />
      <Field label={t('pets.breed')} value={breed} onChangeText={setBreed} />
      <Field label={t('pets.birth')} value={birth} onChangeText={setBirth} placeholder="2023-05-01" />
      <ErrorBanner message={err} />
      <Btn label={t('pets.save')} loading={busy} onPress={save} />
    </ScreenScroll>
  );
}
