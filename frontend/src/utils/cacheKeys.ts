import { cache } from './cache';

export const cacheKeys = {
  despesasMes: (mes: number, ano: number) => `despesas:mes:${mes}:${ano}`,
  estatisticas: (casalId: number, mes: number, ano: number) =>
    `estatisticas:${casalId}:${mes}:${ano}`,
  acerto: (mes: number, ano: number) => `acerto:${mes}:${ano}`,
  casal: (casalId: number) => `casal:${casalId}`,
  membros: (casalId: number) => `casal:membros:${casalId}`,
  categorias: 'categorias',
  saldoCategoria: (categoriaId: number, mes: number, ano: number) =>
    `categoria:saldo:${categoriaId}:${mes}:${ano}`,
  comprovantes: (casalId: number) => `comprovantes:${casalId}`,
  preferencias: 'preferencias',
  imagemFundo: 'preferencias:imagemFundo',
  compensacoes: (mes: number, ano: number) => `compensacoes:${mes}:${ano}`,
  historicoEdicao: (despesaId: number) => `historico:edicao:${despesaId}`,
} as const;

/** Invalida tudo que diz respeito ao mês atual (chamado após criar/editar/deletar despesa). */
export function invalidarDespesasEDerivados(casalId?: number) {
  cache.invalidate('despesas:');
  cache.invalidate('estatisticas:');
  cache.invalidate('acerto:');
  cache.invalidate('compensacoes:');
  cache.invalidate('categoria:saldo:');
  if (casalId) cache.invalidate(`comprovantes:${casalId}`);
}

export function invalidarCategoria() {
  cache.invalidate('categorias');
  cache.invalidate('categoria:saldo:');
}

export function invalidarCasal(casalId?: number) {
  if (casalId) {
    cache.invalidate(cacheKeys.casal(casalId));
    cache.invalidate(cacheKeys.membros(casalId));
  } else {
    cache.invalidate('casal:');
  }
  cache.invalidate('estatisticas:');
}

export function invalidarPreferencias() {
  cache.invalidate('preferencias');
}
