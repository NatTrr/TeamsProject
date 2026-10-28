import React from 'react';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';
import { colors } from './theme';
import type { PetType } from './auth';

type IconDef = { paths: string[]; circles?: [number, number, number][] };

const defs: Record<string, IconDef> = {
  home: { paths: ['M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z'] },
  map: { paths: ['M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18'], circles: [[12, 12, 9]] },
  heart: { paths: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'] },
  user: { paths: ['M4 21c0-4 4-6 8-6s8 2 8 6'], circles: [[12, 8, 4]] },
  pin: { paths: ['M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z'], circles: [[12, 10, 2.5]] },
  bell: { paths: ['M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4'] },
  search: { paths: ['M20 20l-4-4'], circles: [[11, 11, 7]] },
  chevron: { paths: ['M9 5l7 7-7 7'] },
  back: { paths: ['M15 5l-7 7 7 7'] },
  star: { paths: ['M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z'] },
  shop: { paths: ['M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9c0 2 2 3 4 3s4-1 4-3c0 2 2 3 4 3s4-1 4-3M10 20v-5h4v5'] },
  plus: { paths: ['M12 5v14M5 12h14'] },
  edit: { paths: ['M4 20l4-1 11-11-3-3L5 16z', 'M14 6l3 3'] },
  check: { paths: ['M5 12l5 5 9-10'] },
};

export type IconName = keyof typeof defs;

export function Icon({
  name,
  size = 24,
  color = colors.ink,
  fill = 'none',
  strokeWidth = 2.2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  const d = defs[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {d.paths.map((p, i) => (
        <Path key={i} d={p} />
      ))}
      {d.circles?.map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
    </Svg>
  );
}

const faces: Record<PetType, string> = {
  Dog: '<ellipse cx="13" cy="31" rx="8.5" ry="16" fill="#17372A" transform="rotate(12 13 31)"/><ellipse cx="51" cy="31" rx="8.5" ry="16" fill="#17372A" transform="rotate(-12 51 31)"/><ellipse cx="32" cy="34" rx="18" ry="20" fill="#FFF8E6" stroke="#17372A" stroke-width="2.5"/><circle cx="25" cy="30" r="2.7" fill="#17372A"/><circle cx="39" cy="30" r="2.7" fill="#17372A"/><ellipse cx="32" cy="38" rx="5" ry="3.5" fill="#17372A"/><path d="M32 41.5v3.5" stroke="#17372A" stroke-width="2.2" stroke-linecap="round"/><path d="M26.5 45.5c2.4 2.6 8.6 2.6 11 0" fill="none" stroke="#17372A" stroke-width="2.2" stroke-linecap="round"/>',
  Cat: '<path d="M11 30L12 6l17 11z" fill="#FFF8E6" stroke="#17372A" stroke-width="2.5" stroke-linejoin="round"/><path d="M53 30L52 6 35 17z" fill="#FFF8E6" stroke="#17372A" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="32" cy="36" rx="21" ry="19" fill="#FFF8E6" stroke="#17372A" stroke-width="2.5"/><path d="M21 33c1.5-2 5-2 6.5 0M36.5 33c1.5-2 5-2 6.5 0" stroke="#17372A" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M29.5 39h5l-2.5 3z" fill="#F47F68"/><path d="M32 42c0 3-4 3-5 1M32 42c0 3 4 3 5 1" stroke="#17372A" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M8 38l11 2M8 44l11-2M56 38l-11 2M56 44l-11-2" stroke="#17372A" stroke-width="2" stroke-linecap="round"/>',
  Parrot:
    '<path d="M26 14c-2-6 2-10 6-10 0 4 2 6 4 7 1-3 4-5 7-4-1 4-3 6-5 7z" fill="#F47F68" stroke="#17372A" stroke-width="2.2" stroke-linejoin="round"/><circle cx="30" cy="36" r="21" fill="#A5D63F" stroke="#17372A" stroke-width="2.5"/><ellipse cx="25" cy="34" rx="8" ry="9" fill="#FFF8E6" stroke="#17372A" stroke-width="2"/><circle cx="24" cy="33" r="3" fill="#17372A"/><path d="M38 34c10 0 12 8 8 14-3-1-6-4-8-8z" fill="#F6CB5B" stroke="#17372A" stroke-width="2.2" stroke-linejoin="round"/>',
  Hamster:
    '<circle cx="14" cy="19" r="8" fill="#FFE2B0" stroke="#17372A" stroke-width="2.5"/><circle cx="50" cy="19" r="8" fill="#FFE2B0" stroke="#17372A" stroke-width="2.5"/><ellipse cx="32" cy="38" rx="23" ry="20" fill="#FFE2B0" stroke="#17372A" stroke-width="2.5"/><circle cx="23" cy="34" r="2.8" fill="#17372A"/><circle cx="41" cy="34" r="2.8" fill="#17372A"/><ellipse cx="32" cy="39" rx="3.4" ry="2.4" fill="#F47F68"/><path d="M29.5 43.5h5v5h-5z" fill="#fff" stroke="#17372A" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15" cy="43" r="4.5" fill="#F47F68" opacity=".5"/><circle cx="49" cy="43" r="4.5" fill="#F47F68" opacity=".5"/>',
};

export function PetFace({ type, size = 64 }: { type: PetType; size?: number }) {
  return (
    <SvgXml
      width={size}
      height={size}
      xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${faces[type]}</svg>`}
    />
  );
}

export const petColor: Record<PetType, string> = {
  Dog: colors.coral,
  Cat: colors.lilac,
  Parrot: colors.lime,
  Hamster: colors.amber,
};
