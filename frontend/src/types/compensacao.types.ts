export type TipoCompensacao = 'EMPRESTIMO' | 'ADIANTAMENTO_PENSAO' | 'OUTROS';

export const TIPOS_COMPENSACAO: Record<TipoCompensacao, string> = {
  EMPRESTIMO: 'Empréstimo',
  ADIANTAMENTO_PENSAO: 'Adiantamento de Pensão',
  OUTROS: 'Outros',
};

export interface Compensacao {
  id: number;
  tipo: TipoCompensacao;
  descricao: string | null;
  valor: number;
  dataReferencia: string;
  dataCriacao: string;
  usuarioOrigemId: number;
  nomeOrigem: string;
  usuarioDestinoId: number;
  nomeDestino: string;
  ativa: boolean;
}

export interface CompensacaoRequest {
  tipo: TipoCompensacao;
  descricao?: string;
  valor: number;
  dataReferencia: string;
  usuarioOrigemId: number;
  usuarioDestinoId: number;
}

export interface MembroCasal {
  id: number;
  nome: string;
  ehParceiro1: boolean;
}

export interface ParceiroAcerto {
  usuarioId: number;
  nome: string;
  despesasPagas: number;
  compensacoesConcedidas: number;
  compensacoesRecebidas: number;
  valorLiquidoArcado: number;
  saldoFinal: number;
}

export interface AcertoMensalResponse {
  solo: boolean;
  totalDespesasMes: number;
  cotaIdeal: number;
  parceiro1: ParceiroAcerto | null;
  parceiro2: ParceiroAcerto | null;
  resumoFinal: {
    quemDeve: string | null;
    paraQuem: string | null;
    valor: number;
    equilibrado: boolean;
  } | null;
}
