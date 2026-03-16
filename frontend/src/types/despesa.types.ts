export interface Categoria {
  id: number;
  nome: string;
  icone: string;
  cor: string;
  ativa: boolean;
  orcamentoMensal?: number;
}

export interface DespesaRequest {
  dataTransacao: string;
  descricao: string;
  valor: number;
  categoriaId: number;
  responsavel: string;
  tipoDespesa: string;
  metodoPagamento: string;
  observacoes?: string;
  urlComprovante?: string;
  valorPrevisto?: number;
}

export interface Despesa {
  id: number;
  dataTransacao: string;
  dataCriacao?: string;
  descricao: string;
  valor: number;
  categoriaNome: string;
  categoriaId: number;
  responsavel: string;
  tipoDespesa: string;
  metodoPagamento: string;
  observacoes?: string;
  usuarioNome: string;
  editada?: boolean;
  urlComprovante?: string;
  valorPrevisto?: number;
}
