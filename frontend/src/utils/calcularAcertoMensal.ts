const ACERTO_THRESHOLD = 0.01;

const toNumber = (value: number | null | undefined): number => {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
};

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getStatus = (value: number): 'A receber' | 'A pagar' | 'Em dia' => {
  if (value > ACERTO_THRESHOLD) return 'A receber';
  if (value < -ACERTO_THRESHOLD) return 'A pagar';
  return 'Em dia';
};

interface AcertoPessoaInput {
  usuarioId: number;
  nome: string;
  valorPago: number;
  compensacoesConcedidas: number;
  compensacoesRecebidas: number;
}

export interface AcertoMensalInput {
  totalMes: number;
  cotaBase: number;
  totalCompensacoesMes: number;
  pessoas: AcertoPessoaInput[];
}

export interface AcertoMensalPessoa {
  usuarioId: number;
  nome: string;
  status: 'A receber' | 'A pagar' | 'Em dia';
  valorPago: number;
  cotaBase: number;
  valorLiquidoDevido: number;
  compensacoes: number;
  valorTotalDevido: number;
}

export interface AcertoMensalResultadoFinal {
  texto: string;
  devedor: string | null;
  credor: string | null;
  valor: number;
}

export interface AcertoMensalCalculado {
  totalMes: number;
  cotaBase: number;
  participantes: number;
  totalCompensacoesMes: number;
  pessoas: AcertoMensalPessoa[];
  resultadoFinal: AcertoMensalResultadoFinal;
}

export const calcularAcertoMensal = ({
  totalMes,
  cotaBase,
  totalCompensacoesMes,
  pessoas,
}: AcertoMensalInput): AcertoMensalCalculado => {
  const cota = roundCurrency(toNumber(cotaBase));

  const pessoasCalculadas = pessoas.map((pessoa) => {
    const valorPago = roundCurrency(toNumber(pessoa.valorPago));
    const valorLiquidoDevido = roundCurrency(valorPago - cota);
    const compensacoes = roundCurrency(
      toNumber(pessoa.compensacoesConcedidas) - toNumber(pessoa.compensacoesRecebidas),
    );
    const valorTotalDevido = roundCurrency(valorLiquidoDevido + compensacoes);

    return {
      usuarioId: pessoa.usuarioId,
      nome: pessoa.nome,
      status: getStatus(valorTotalDevido),
      valorPago,
      cotaBase: cota,
      valorLiquidoDevido,
      compensacoes,
      valorTotalDevido,
    };
  });

  const positivos = pessoasCalculadas
    .filter((pessoa) => pessoa.valorTotalDevido > ACERTO_THRESHOLD)
    .sort((a, b) => b.valorTotalDevido - a.valorTotalDevido);

  const negativos = pessoasCalculadas
    .filter((pessoa) => pessoa.valorTotalDevido < -ACERTO_THRESHOLD)
    .sort((a, b) => a.valorTotalDevido - b.valorTotalDevido);

  let resultadoFinal: AcertoMensalResultadoFinal = {
    texto: 'Sem acerto pendente neste mes',
    devedor: null,
    credor: null,
    valor: 0,
  };

  if (positivos.length > 0 && negativos.length > 0) {
    const credor = positivos[0];
    const devedor = negativos[0];
    const valor = roundCurrency(Math.min(credor.valorTotalDevido, Math.abs(devedor.valorTotalDevido)));

    if (valor >= ACERTO_THRESHOLD) {
      resultadoFinal = {
        texto: `${devedor.nome} deve R$ ${formatCurrency(valor)} para ${credor.nome}`,
        devedor: devedor.nome,
        credor: credor.nome,
        valor,
      };
    }
  }

  return {
    totalMes: roundCurrency(toNumber(totalMes)),
    cotaBase: cota,
    participantes: pessoasCalculadas.length,
    totalCompensacoesMes: roundCurrency(toNumber(totalCompensacoesMes)),
    pessoas: pessoasCalculadas,
    resultadoFinal,
  };
};
