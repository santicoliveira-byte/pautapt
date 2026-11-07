export interface AccentColor {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  glow: string;
  bgLight: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: 'blue',
    name: 'Azul iOS',
    hex: '#0A84FF',
    rgb: '10 132 255',
    glow: 'rgba(10, 132, 255, 0.4)',
    bgLight: 'rgba(10, 132, 255, 0.15)',
  },
  {
    id: 'purple',
    name: 'Roxo Neón',
    hex: '#BF5AF2',
    rgb: '191 90 242',
    glow: 'rgba(191, 90, 242, 0.4)',
    bgLight: 'rgba(191, 90, 242, 0.15)',
  },
  {
    id: 'emerald',
    name: 'Verde Menta',
    hex: '#30D158',
    rgb: '48 209 88',
    glow: 'rgba(48, 209, 88, 0.4)',
    bgLight: 'rgba(48, 209, 88, 0.15)',
  },
  {
    id: 'orange',
    name: 'Laranja Sunset',
    hex: '#FF9F0A',
    rgb: '255 159 10',
    glow: 'rgba(255, 159, 10, 0.4)',
    bgLight: 'rgba(255, 159, 10, 0.15)',
  },
  {
    id: 'pink',
    name: 'Rosa Coral',
    hex: '#FF375F',
    rgb: '255 55 95',
    glow: 'rgba(255, 55, 95, 0.4)',
    bgLight: 'rgba(255, 55, 95, 0.15)',
  },
];

const THEME_STORAGE_KEY = 'pautapt_accent_color_v1';

export function getStoredAccentColor(): AccentColor {
  if (typeof window === 'undefined') return ACCENT_COLORS[0];
  try {
    const savedId = localStorage.getItem(THEME_STORAGE_KEY);
    const found = ACCENT_COLORS.find((c) => c.id === savedId);
    return found || ACCENT_COLORS[0];
  } catch {
    return ACCENT_COLORS[0];
  }
}

export function applyAccentColor(accent: AccentColor) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent-rgb', accent.rgb);
  root.style.setProperty('--accent-hex', accent.hex);
  root.style.setProperty('--accent-glow', accent.glow);
  root.style.setProperty('--accent-bg-light', accent.bgLight);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, accent.id);
  } catch {
    // ignore
  }
}
