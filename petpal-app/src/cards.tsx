import React from 'react';
import { Pressable, View } from 'react-native';
import { colors } from './theme';
import { Icon } from './icons';
import { Txt } from './ui';
import { useI18n } from './i18n';
import type { PlaceSummary, WalkerSummary } from './types';

const tint: Record<string, string> = {
  Shop: colors.lilac,
  DogPark: colors.lime,
  Vet: colors.coral,
  EmergencyVet: colors.coral,
};

function Badge({ text, bg = colors.lime }: { text: string; bg?: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: bg, borderWidth: 2, borderColor: colors.ink }}>
      <Txt variant="small" style={{ fontFamily: 'Rubik_700Bold', fontSize: 12 }}>
        {text}
      </Txt>
    </View>
  );
}

function Row({ icon, bg, title, line, badge, onPress }: { icon: React.ReactNode; bg: string; title: string; line: string; badge?: React.ReactNode; onPress?: () => void }) {
  return (
    <View style={{ backgroundColor: colors.ink, borderRadius: 22, paddingBottom: 4, marginBottom: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={{ backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink, borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bg, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bold" style={{ fontSize: 16 }} numberOfLines={1}>
            {title}
          </Txt>
          <Txt variant="muted" style={{ fontSize: 13 }} numberOfLines={2}>
            {line}
          </Txt>
        </View>
        {badge}
      </Pressable>
    </View>
  );
}

const km = (d: number | null) => (d == null ? '' : `${d.toFixed(1)} km`);
const rate = (r: number | null, n: number, fresh: string) => (r == null || n === 0 ? fresh : `★ ${r.toFixed(1)} (${n})`);

export function PlaceCard({ p, onPress, trailing }: { p: PlaceSummary; onPress?: () => void; trailing?: React.ReactNode }) {
  const { t } = useI18n();
  const icon = p.type === 'Shop' ? 'shop' : 'pin';
  return (
    <Row
      icon={<Icon name={icon} />}
      bg={tint[p.type] ?? colors.lilac}
      title={p.name}
      line={[rate(p.avgRating, p.reviewCount, t('place.new')), km(p.distanceKm), p.address].filter(Boolean).join(' · ')}
      badge={trailing ?? (p.isOpen24h ? <Badge text={t('place.open24')} /> : undefined)}
      onPress={onPress}
    />
  );
}

export function WalkerCard({ w, onPress }: { w: WalkerSummary; onPress?: () => void }) {
  const { t } = useI18n();
  return (
    <Row
      icon={<Txt variant="display" style={{ fontSize: 22 }}>{w.name[0]?.toUpperCase()}</Txt>}
      bg={colors.amber}
      title={w.name}
      line={[rate(w.avgRating, w.reviewCount, t('place.new')), km(w.distanceKm), w.bio].filter(Boolean).join(' · ')}
      badge={<Badge text={`${Math.round(w.pricePerWalk)} ден`} bg={colors.amber} />}
      onPress={onPress}
    />
  );
}
