import { cache } from './cache';

/** Limpa storage + cache em memória. Use sempre via fazerLogout(navigate). */
export function fazerLogout(navigate: (path: string) => void) {
  cache.clear();
  localStorage.clear();
  navigate('/login');
}
