import { useContext } from 'react';
import { PrefsContext } from '@/context/prefs-context';

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within a PrefsProvider');
  return ctx;
}
