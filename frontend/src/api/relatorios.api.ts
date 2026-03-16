import { api } from './axios';

export const relatoriosApi = {
  gastosPorCategoria: async (casalId: number, mes: number, ano: number) => {
    const response = await api.get('/relatorios/gastos-por-categoria', {
      params: { casalId, mes, ano }
    });
    return response.data;
  },

  evolucaoMensal: async (casalId: number, ano: number) => {
    const response = await api.get('/relatorios/evolucao-mensal', {
      params: { casalId, ano }
    });
    return response.data;
  },

  comparacaoParceiros: async (casalId: number, mes: number, ano: number) => {
    const response = await api.get('/relatorios/comparacao-parceiros', {
      params: { casalId, mes, ano }
    });
    return response.data;
  },

  gastosPorCategoriaPeriodo: async (casalId: number, dataInicio: string, dataFim: string) => {
    const response = await api.get('/relatorios/gastos-por-categoria/periodo', {
      params: { casalId, dataInicio, dataFim }
    });
    return response.data;
  },

  comparacaoParceirosPeriodo: async (casalId: number, dataInicio: string, dataFim: string) => {
    const response = await api.get('/relatorios/comparacao-parceiros/periodo', {
      params: { casalId, dataInicio, dataFim }
    });
    return response.data;
  },
};
