export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  id: number;
  nome: string;
  email: string;
  casalId?: number;
  ehParceiro1?: boolean;
  fotoPerfil?: string | null;
}
