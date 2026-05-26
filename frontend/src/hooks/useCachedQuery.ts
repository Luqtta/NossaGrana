import { useEffect, useRef, useState } from 'react';
import { cache } from '../utils/cache';

export type CachedQueryResult<T> = {
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  error: unknown;
  refetch: () => Promise<void>;
};

export type UseCachedQueryOptions = {
  /** Tempo (ms) que o cache é considerado fresco. Dentro desse prazo, não faz refetch em background. Default: 0 (sempre revalida) */
  freshFor?: number;
  /** Se true, não executa o fetch. Útil quando depende de algum id que ainda não chegou. */
  enabled?: boolean;
};

/**
 * Stale-while-revalidate: retorna cache imediato e revalida em background.
 * - Primeira vez (sem cache): loading=true até chegar a resposta.
 * - Visitas seguintes: data já vem preenchido do cache, refreshing=true durante o fetch silencioso.
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedQueryOptions = {},
): CachedQueryResult<T> {
  const { freshFor = 0, enabled = true } = options;
  const [, force] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const inFlight = useRef(false);

  const cached = cache.get<T>(key);
  const hasCached = cache.has(key);

  // re-renderiza quando o cache da key muda
  useEffect(() => {
    return cache.subscribe(key, () => force(n => n + 1));
  }, [key]);

  // fetch (com proteção contra chamadas duplicadas)
  useEffect(() => {
    if (!enabled) return;
    if (inFlight.current) return;
    if (hasCached && cache.age(key) < freshFor) return;

    const isInitialLoad = !hasCached;
    if (!isInitialLoad) setRefreshing(true);
    inFlight.current = true;

    fetcher()
      .then(data => {
        cache.set(key, data);
        setError(null);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        inFlight.current = false;
        setRefreshing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const refetch = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(hasCached);
    try {
      const data = await fetcher();
      cache.set(key, data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  };

  return {
    data: cached,
    loading: !hasCached && !error,
    refreshing,
    error,
    refetch,
  };
}
