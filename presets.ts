import { LightMode, Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'focus',
    name: 'Focus',
    iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    config: { color: '#f8fafc', brightness: 100, strobeInterval: 0 },
    forcedMode: LightMode.SCREEN
  },
  {
    id: 'reading',
    name: 'Reading',
    iconPath: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    config: { color: '#ffedd5', brightness: 75, strobeInterval: 0 },
    forcedMode: LightMode.SCREEN
  },
  {
    id: 'night',
    name: 'Night',
    iconPath: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    config: { color: '#ef4444', brightness: 15, strobeInterval: 0 },
    forcedMode: LightMode.SCREEN
  },
  {
    id: 'party',
    name: 'Party',
    iconPath: 'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 9.724a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z',
    config: { color: '#d946ef', brightness: 100, strobeInterval: 150 },
    forcedMode: LightMode.SCREEN
  },
  {
    id: 'sos',
    name: 'SOS',
    iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    config: { color: '#ffffff', brightness: 100, strobeInterval: -1 },
  },
  {
    id: 'warm',
    name: 'Warm',
    iconPath: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.25l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    config: { color: '#f59e0b', brightness: 60, strobeInterval: 0 },
    forcedMode: LightMode.SCREEN
  }
];