import { api } from './axios';
import { cache } from '../utils/cache';

const getCasalId = (): number => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.casalId) throw new Error('Casal nao encontrado');
  return user.casalId;
};

export interface Comprovante {
  id: number;
  nome: string;
  mimeType: string;
  mes: number;
  ano: number;
  despesaId?: number;
  descricaoDespesa?: string;
  usuarioNome?: string;
  dataCriacao?: string;
}

export interface ComprovanteUploadRequest {
  nome: string;
  mimeType: string;
  dadosBase64: string;
  mes: number;
  ano: number;
  despesaId?: number;
}

export const comprovantesApi = {
  upload: async (request: ComprovanteUploadRequest): Promise<Comprovante> => {
    const response = await api.post('/comprovantes', request);
    cache.invalidate('comprovantes:');
    return response.data;
  },

  listar: async (): Promise<Comprovante[]> => {
    const casalId = getCasalId();
    const response = await api.get(`/comprovantes/casal/${casalId}`);
    return response.data;
  },

  listarPorMes: async (mes: number, ano: number): Promise<Comprovante[]> => {
    const casalId = getCasalId();
    const response = await api.get(`/comprovantes/casal/${casalId}/mes/${mes}/ano/${ano}`);
    return response.data;
  },

  downloadUrl: (id: number): string => {
    const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
    return `${base}/comprovantes/${id}/download`;
  },

  baixarBlob: async (id: number): Promise<string> => {
    const response = await api.get(`/comprovantes/${id}/download`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/comprovantes/${id}`);
    cache.invalidate('comprovantes:');
  },
};
