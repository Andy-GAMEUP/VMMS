import { create } from 'zustand';

export type Lang = 'ko' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: (localStorage.getItem('vmms-lang') as Lang) || 'ko',
  setLang: (lang) => {
    localStorage.setItem('vmms-lang', lang);
    set({ lang });
  },
}));
