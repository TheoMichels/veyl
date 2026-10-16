export type DigestCategory = 'IA' | 'Luxembourg' | 'Tech';

export type TabId = 'ia' | 'lux' | 'tech';

export type ThemeMode = 'light' | 'dark';

export type ViewMode = 'dashboard' | 'settings';

export interface Digest {
  id: string;
  category: DigestCategory;
  title: string;
  content: string;
  createdAt: string;
}

export interface DayGroup {
  dateStr: string;
  displayDate: string;
  iaDigest: Digest | null;
  luxDigest: Digest | null;
  techDigest: Digest | null;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  category: DigestCategory;
  isActive: boolean;
}

export interface Settings {
  id: string;
  geminiPromptIA: string;
  geminiPromptLux: string;
  geminiPromptTech: string;
  cronEnabled: boolean;
}
