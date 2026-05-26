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
  /** Sempre null no novo fluxo — refresh token agora vai no cookie HttpOnly. Mantido pra compat. */
  refreshToken?: string | null;
  id: number;
  nome: string;
  email: string;
  casalId?: number;
  ehParceiro1?: boolean;
  fotoPerfil?: string | null;
}
