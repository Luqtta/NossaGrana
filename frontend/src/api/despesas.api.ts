import { api } from './axios';
import type { Despesa, DespesaRequest } from '../types/despesa.types';

const getCasalId = (): number => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.casalId) {
    throw new Error('Casal nao encontrado');
  }
  return user.casalId;
};

export interface FiltrosDespesas {
  categoriaId?: number;
  responsavel?: string;
  tipoDespesa?: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
}

export const despesasApi = {
  criar: async (despesa: DespesaRequest): Promise<Despesa> => {
    const response = await api.post('/despesas', despesa);
    return response.data;
  },

  listarPorMes: async (mes: number, ano: number): Promise<Despesa[]> => {
    const casalId = getCasalId();
    const response = await api.get(`/despesas/casal/${casalId}/mes/${mes}/ano/${ano}`);
    return response.data;
  },

  atualizar: async (id: number, despesa: DespesaRequest): Promise<Despesa> => {
    const response = await api.put(`/despesas/${id}`, despesa);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/despesas/${id}`);
  },

  cancelarRecorrencia: async (id: number): Promise<Despesa> => {
    const response = await api.patch(`/despesas/${id}/cancelar-recorrencia`);
    return response.data;
  },

  buscarHistorico: async (id: number): Promise<HistoricoEdicaoItem[]> => {
    const response = await api.get(`/despesas/${id}/historico`);
    return response.data;
  },

  filtrar: async (casalId: number, filtros: FiltrosDespesas): Promise<Despesa[]> => {
    const response = await api.get('/despesas/filtrar', {
      params: { casalId, ...filtros }
    });
    return response.data;
  },
};

export interface HistoricoEdicaoItem {
  id: number;
  campoAlterado: string;
  valorAntigo: string;
  valorNovo: string;
  dataEdicao: string;
}
