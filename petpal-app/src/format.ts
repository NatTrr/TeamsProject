export const fmtDateTime = (iso: string, lang: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(lang === 'mk' ? 'mk-MK' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const ago = (iso: string, lang: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (isNaN(days)) return '';
  if (lang === 'mk') return days <= 0 ? 'Денес' : days === 1 ? 'Пред 1 ден' : `Пред ${days} дена`;
  return days <= 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
};

// "2026-11-01" + "09:00" -> Date (local time) or null
export const parseLocal = (date: string, time: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m || !t) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  return isNaN(d.getTime()) ? null : d;
};

export const ageYears = (birth?: string | null) => {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000)));
};

// "41.9981, 21.4254" (as copied from Google Maps) -> {latitude, longitude} or null
export const parseCoords = (s: string) => {
  const p = s.trim().split(/[,;]\s*|\s+/).filter(Boolean).map((x) => Number(x.replace(',', '.')));
  if (p.length !== 2 || p.some((x) => isNaN(x)) || Math.abs(p[0]) > 90 || Math.abs(p[1]) > 180) return null;
  return { latitude: p[0], longitude: p[1] };
};
