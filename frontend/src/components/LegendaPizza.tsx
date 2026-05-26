import { formatBRL } from '../utils/formatBRL';

export interface ItemLegenda {
  nome: string;
  valor: number;
  cor: string;
}

interface Props {
  itens: ItemLegenda[];
  /** Numero de colunas. Default 2. */
  colunas?: 1 | 2 | 3;
}

/**
 * Legenda estilo planilha para graficos de pizza: bolinha colorida + nome a esquerda,
 * valor em R$ e percentual a direita, alinhados em grid com numeros tabulares.
 */
export function LegendaPizza({ itens, colunas = 2 }: Props) {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const itensOrdenados = [...itens].sort((a, b) => b.valor - a.valor);

  const colClasse = colunas === 1
    ? 'grid-cols-1'
    : colunas === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`mt-4 grid ${colClasse} gap-x-5 gap-y-1.5 text-sm`}>
      {itensOrdenados.map((item, i) => {
        const pct = total > 0 ? (item.valor / total) * 100 : 0;
        return (
          <div
            key={i}
            className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60 py-1.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: item.cor }}
              />
              <span className="truncate text-gray-700 dark:text-gray-300">{item.nome}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-gray-900 dark:text-white font-semibold tabular-nums">
                R$ {formatBRL(item.valor)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 tabular-nums w-12 text-right text-xs">
                {pct.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
      {total > 0 && (
        <div className={`flex items-center justify-between gap-3 pt-2 mt-1 ${colunas === 1 ? '' : 'col-span-full'} border-t border-gray-200 dark:border-gray-700`}>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">R$ {formatBRL(total)}</span>
        </div>
      )}
    </div>
  );
}
