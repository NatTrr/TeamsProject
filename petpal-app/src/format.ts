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

// Accepts 2026-10-17, 2026 10 17, 2026/10/17, 17.10.2026 ... -> {y,m,d} or null
export const looseDate = (s: string) => {
  s = s.trim();
  let y: number, m: number, d: number;
  let r = /^(\d{4})[-./\s]+(\d{1,2})[-./\s]+(\d{1,2})$/.exec(s);
  if (r) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else {
    r = /^(\d{1,2})[-./\s]+(\d{1,2})[-./\s]+(\d{4})$/.exec(s);
    if (!r) return null;
    d = +r[1]; m = +r[2]; y = +r[3];
  }
  const t = new Date(y, m - 1, d);
  if (t.getFullYear() !== y || t.getMonth() !== m - 1 || t.getDate() !== d) return null;
  return { y, m, d };
};

// "2026-11-01" + "09:00" -> Date (local time) or null
export const parseLocal = (date: string, time: string) => {
  const m = looseDate(date);
  const t = /^(\d{1,2})[:.](\d{2})$/.exec(time.trim());
  if (!m || !t) return null;
  const d = new Date(m.y, m.m - 1, m.d, +t[1], +t[2]);
  return isNaN(d.getTime()) ? null : d;
};

// "2026-10-17T18:00", "2026-10-17 18:00", "2026 10 17 18:00", "17.10.2026 18:00" -> Date or null (no time = 09:00)
export const parseLooseDateTime = (s: string) => {
  const r = /^(.*?)(?:[T\s]+(\d{1,2}[:.]\d{2}))?$/.exec(s.trim());
  if (!r) return null;
  return parseLocal(r[1], r[2] ?? '09:00');
};

// Google Maps place link -> name + exact pin (works with long links; short links cannot be opened from the browser)
export const parseMapsLink = (url: string) => {
  const u = url.trim();
  if (!/^https?:\/\//i.test(u) || !/google\.[a-z.]+\/maps|maps\.google\./i.test(u)) return null;
  let name: string | null = null;
  const pm = /\/maps\/place\/([^/@?]+)/.exec(u);
  if (pm) {
    try { name = decodeURIComponent(pm[1].replace(/\+/g, ' ')).trim(); } catch { name = pm[1].replace(/\+/g, ' '); }
  }
  let c: RegExpExecArray | null = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(u); // the exact pin
  if (!c) c = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(u); // map centre
  if (!c) c = /[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?)(?:,|%2C)(-?\d+(?:\.\d+)?)/.exec(u);
  const coords = c ? { latitude: +c[1], longitude: +c[2] } : null;
  if (coords && (Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180)) return null;
  return { name, coords };
};

// Free address lookup from coordinates (OpenStreetMap Nominatim)
export const reverseGeocode = async (lat: number, lng: number, lang: string) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}&accept-language=${lang === 'mk' ? 'mk' : 'en'}`);
  if (!res.ok) throw new Error('geocode');
  const j = await res.json();
  const a = j?.address ?? {};
  const street = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(' ');
  const address = street || a.neighbourhood || a.suburb || '';
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? '';
  return { address: String(address), city: String(city) };
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
