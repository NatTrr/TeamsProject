import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getItem, setItem } from './storage';

export type Lang = 'en' | 'mk';

const dict = {
  en: {
    'welcome.title': 'Hello, pet people.',
    'welcome.subtitle':
      'For dogs, cats, parrots and hamsters. Walkers, shops, vets and parks near you, plus a quick check on whether that snack is safe.',
    'welcome.go': "Let's go",
    'welcome.haveAccount': 'I already have an account',
    'common.back': 'Back',
  },
  mk: {
    'welcome.title': 'Здраво, љубители на миленичиња.',
    'welcome.subtitle':
      'За кучиња, мачки, папагали и хрчаци. Шетачи, продавници, ветеринари и паркови во близина.',
    'welcome.go': 'Ајде',
    'welcome.haveAccount': 'Веќе имам профил',
    'common.back': 'Назад',
  },
} as const;

export type TKey = keyof (typeof dict)['en'];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };
const I18nContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    getItem('lang').then((v) => {
      if (v === 'en' || v === 'mk') setLangState(v);
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setItem('lang', l);
  }, []);

  const t = useCallback((k: TKey) => dict[lang][k] ?? dict.en[k] ?? k, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
