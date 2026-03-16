import { api } from './axios';

export interface CasalData {
  id: number;
  nomeParceiro1: string | null;
  nomeParceiro2: string | null;
  emailConviteParceiro2: string | null;
  conviteAceito: boolean;
  metaMensal: number;
  dataCriacao: string;
}

export interface ConviteRequest {
  email: string;
}

export interface AtualizarNomesRequest {
  nomeParceiro1: string;
  nomeParceiro2: string;
}

export interface EstatisticasData {
  totalParceiro1: number;
  totalParceiro2: number;
  totalCompartilhado: number;
  totalGeral: number;
  metaMensal: number;
  saldo: number;
  nomeParceiro1: string;
  nomeParceiro2: string;
}

export const casalApi = {
  buscar: async (casalId: number): Promise<CasalData> => {
    const response = await api.get(`/casal/${casalId}`);
    return response.data;
  },

  enviarConvite: async (email: string): Promise<void> => {
    await api.post('/convites', { email });
  },

  removerParceiro: async (casalId: number): Promise<void> => {
    await api.delete(`/casal/${casalId}/remover-parceiro`);
  },

  atualizarNomes: async (casalId: number, data: AtualizarNomesRequest): Promise<void> => {
    await api.put(`/casal/${casalId}/atualizar-nomes`, data);
  },

  definirMeta: async (casalId: number, metaMensal: number): Promise<void> => {
    await api.put(`/casal/${casalId}/meta`, { metaMensal });
  },

  buscarEstatisticas: async (casalId: number, mes: number, ano: number): Promise<EstatisticasData> => {
    const response = await api.get(`/casal/${casalId}/estatisticas`, {
      params: { mes, ano }
    });
    return response.data;
  },
};
