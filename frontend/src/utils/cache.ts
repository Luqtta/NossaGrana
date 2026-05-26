type Entry<T> = {
  data: T;
  savedAt: number;
};

const store = new Map<string, Entry<unknown>>();
const listeners = new Map<string, Set<() => void>>();

export const cache = {
  get<T>(key: string): T | undefined {
    return (store.get(key) as Entry<T> | undefined)?.data;
  },

  set<T>(key: string, data: T): void {
    store.set(key, { data, savedAt: Date.now() });
    listeners.get(key)?.forEach(fn => fn());
  },

  has(key: string): boolean {
    return store.has(key);
  },

  age(key: string): number {
    const entry = store.get(key);
    return entry ? Date.now() - entry.savedAt : Infinity;
  },

  invalidate(keyOrPrefix: string): void {
    if (store.delete(keyOrPrefix)) {
      listeners.get(keyOrPrefix)?.forEach(fn => fn());
      return;
    }
    // se não existir exato, trata como prefixo
    for (const key of Array.from(store.keys())) {
      if (key.startsWith(keyOrPrefix)) {
        store.delete(key);
        listeners.get(key)?.forEach(fn => fn());
      }
    }
  },

  clear(): void {
    store.clear();
    listeners.forEach(set => set.forEach(fn => fn()));
  },

  subscribe(key: string, fn: () => void): () => void {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
      if (set && set.size === 0) listeners.delete(key);
    };
  },
};
