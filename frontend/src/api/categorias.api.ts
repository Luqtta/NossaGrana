import { api } from './axios';
import type { Categoria } from '../types/despesa.types';

const getCasalId = (): number => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.casalId || 1;
};

export interface SaldoCategoriaData {
  categoriaId: number;
  nomeCategoria: string;
  icone: string;
  cor: string;
  orcamentoMensal: number;
  totalGasto: number;
  saldo: number;
  percentualGasto: number;
  status: 'VERDE' | 'AMARELO' | 'VERMELHO';
}

export const categoriasApi = {
  listarPorCasal: async (): Promise<Categoria[]> => {
    const casalId = getCasalId();
    const response = await api.get(`/categorias/casal/${casalId}`);
    return response.data;
  },

  definirOrcamento: async (categoriaId: number, orcamento: number): Promise<void> => {
    await api.put(`/categorias/${categoriaId}/orcamento`, { orcamento });
  },

  buscarSaldo: async (categoriaId: number, mes: number, ano: number): Promise<SaldoCategoriaData> => {
    const response = await api.get(`/categorias/${categoriaId}/saldo`, {
      params: { mes, ano }
    });
    return response.data;
  },

  criar: async (categoria: { nome: string; icone: string; cor: string; orcamento: number; casalId: number }): Promise<Categoria> => {
    const response = await api.post('/categorias', categoria);
    return response.data;
  },

  editar: async (id: number, categoria: { nome: string; icone: string; cor: string }): Promise<void> => {
    await api.put(`/categorias/${id}`, categoria);
  },

  desativar: async (id: number): Promise<void> => {
    await api.delete(`/categorias/${id}`);
  },
};
