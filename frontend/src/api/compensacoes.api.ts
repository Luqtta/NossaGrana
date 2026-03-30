import { api } from './axios';
import type {
  AcertoMensalResponse,
  Compensacao,
  CompensacaoRequest,
  MembroCasal,
} from '../types/compensacao.types';

const getCasalId = (): number => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.casalId) throw new Error('Casal não encontrado');
  return user.casalId;
};

export const compensacoesApi = {
  criar: async (data: CompensacaoRequest): Promise<Compensacao> => {
    const response = await api.post('/compensacoes', data);
    return response.data;
  },

  listarPorMes: async (mes: number, ano: number): Promise<Compensacao[]> => {
    const casalId = getCasalId();
    const response = await api.get(`/compensacoes/casal/${casalId}/mes/${mes}/ano/${ano}`);
    return response.data;
  },

  atualizar: async (id: number, data: CompensacaoRequest): Promise<Compensacao> => {
    const response = await api.put(`/compensacoes/${id}`, data);
    return response.data;
  },

  inativar: async (id: number): Promise<void> => {
    await api.delete(`/compensacoes/${id}`);
  },

  calcularAcerto: async (mes: number, ano: number): Promise<AcertoMensalResponse> => {
    const casalId = getCasalId();
    const response = await api.get(`/compensacoes/casal/${casalId}/acerto`, {
      params: { mes, ano },
    });
    return response.data;
  },

  buscarMembros: async (): Promise<MembroCasal[]> => {
    const casalId = getCasalId();
    const response = await api.get(`/casal/${casalId}/membros`);
    return response.data;
  },
};
