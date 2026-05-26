import { cache } from './cache';
import { api } from '../api/axios';

/**
 * Faz logout: tenta invalidar tokens no backend (best-effort) e limpa estado local.
 * Use sempre via fazerLogout(navigate).
 */
export function fazerLogout(navigate: (path: string) => void) {
  // best-effort: revoga sessao no servidor (incrementa tokenVersao).
  // se falhar (offline, token ja expirado), seguimos com o cleanup local.
  api.post('/auth/logout').catch(() => {});
  cache.clear();
  localStorage.clear();
  navigate('/login');
}
