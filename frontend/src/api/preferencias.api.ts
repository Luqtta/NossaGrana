import { api } from './axios';
import { cache } from '../utils/cache';

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
    return response.data;
  },

  imagemFundoBlobUrl: async (): Promise<string | null> => {
    try {
      const response = await api.get('/preferencias-dashboard/imagem-fundo', { responseType: 'blob' });
      return URL.createObjectURL(response.data);
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
