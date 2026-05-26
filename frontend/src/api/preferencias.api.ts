import { api } from './axios';
import { cache } from '../utils/cache';
import { cacheKeys } from '../utils/cacheKeys';

export interface PreferenciasDashboard {
  corDestaque?: string;
  temImagemFundo?: boolean;
  imagemFundoMime?: string;
  opacidadeFundo?: number;
  ordemCards?: string;
  cardsEscondidos?: string;
}

export interface PreferenciasUpdateRequest {
  corDestaque?: string;
  imagemFundoBase64?: string;
  imagemFundoMime?: string;
  removerImagemFundo?: boolean;
  opacidadeFundo?: number;
  ordemCards?: string;
  cardsEscondidos?: string;
}

export const preferenciasApi = {
  buscar: async (): Promise<PreferenciasDashboard> => {
    const response = await api.get('/preferencias-dashboard');
    return response.data;
  },

  atualizar: async (request: PreferenciasUpdateRequest): Promise<PreferenciasDashboard> => {
    const response = await api.put('/preferencias-dashboard', request);
    cache.invalidate('preferencias');
    // libera o blob antigo da memoria do navegador antes de invalidar
    const urlAntiga = cache.get<string>(cacheKeys.imagemFundo);
    if (urlAntiga) URL.revokeObjectURL(urlAntiga);
    cache.invalidate(cacheKeys.imagemFundo);
    return response.data;
  },

  imagemFundoBlobUrl: async (): Promise<string | null> => {
    // Cacheado em memoria — o blob URL fica valido enquanto a aba estiver aberta.
    const cached = cache.get<string>(cacheKeys.imagemFundo);
    if (cached) return cached;
    try {
      const response = await api.get('/preferencias-dashboard/imagem-fundo', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      cache.set(cacheKeys.imagemFundo, url);
      return url;
    } catch {
      return null;
    }
  },
};

export const CARDS_DISPONIVEIS = [
  { id: 'totalGasto', label: 'Total Gasto' },
  { id: 'saldoMes', label: 'Saldo do Mês' },
  { id: 'metaMensal', label: 'Meta Mensal' },
  { id: 'orcamentoGeral', label: 'Orçamento Geral' },
  { id: 'gastosPorPessoa', label: 'Gastos por Pessoa' },
  { id: 'acertoMes', label: 'Acerto do Mês' },
  { id: 'ultimasDespesas', label: 'Últimas Despesas' },
] as const;

export type CardId = typeof CARDS_DISPONIVEIS[number]['id'];
