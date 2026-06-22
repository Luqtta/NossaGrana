import { api } from './axios';
import type { AuthResponse } from '../types/auth.types';
import { cache } from '../utils/cache';

export interface UsuarioResponse {
  id: number;
  nome: string;
  email: string;
  casalId?: number;
  ehParceiro1?: boolean;
  fotoPerfil?: string | null;
}

export const usuarioApi = {
  buscarMe: async (): Promise<UsuarioResponse> => {
    const response = await api.get('/usuarios/me');
    return response.data;
  },

  atualizarNome: async (nome: string): Promise<UsuarioResponse> => {
    const response = await api.put('/usuarios/me/nome', { nome });
    cache.invalidate('casal:');
    return response.data;
  },

  atualizarFoto: async (fotoPerfil: string | null): Promise<UsuarioResponse> => {
    const response = await api.put('/usuarios/me/foto', { fotoPerfil });
    cache.invalidate('casal:membros:');
    return response.data;
  },

  solicitarTrocaEmail: async (novoEmail: string): Promise<void> => {
    await api.post('/usuarios/me/email/solicitar', { novoEmail });
  },

  confirmarTrocaEmail: async (codigo: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/usuarios/me/email/confirmar', { codigo });
    return response.data;
  },

  solicitarTrocaSenha: async (): Promise<void> => {
    await api.post('/usuarios/me/senha/solicitar');
  },

  confirmarTrocaSenha: async (senhaAtual: string, codigo: string, novaSenha: string): Promise<void> => {
    await api.post('/usuarios/me/senha/confirmar', { senhaAtual, codigo, novaSenha });
  },
};
