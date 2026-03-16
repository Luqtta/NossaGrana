import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { despesasApi } from '../api/despesas.api';
import { relatoriosApi } from '../api/relatorios.api';
import { casalApi } from '../api/casal.api';
import type { CasalData } from '../api/casal.api';
import { formatBRL } from '../utils/formatBRL';
import type { Despesa } from '../types/despesa.types';

type TipoPeriodo = 'dia' | 'mes' | 'ano';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ANOS = [2023, 2024, 2025, 2026, 2027];

const VERDE: [number, number, number] = [16, 185, 129];

export const ModalExportarPDF = ({ isOpen, onClose }: Props) => {
  const [tipo, setTipo] = useState<TipoPeriodo>('mes');
  const [dia, setDia] = useState(new Date().toISOString().split('T')[0]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [gerando, setGerando] = useState(false);

  if (!isOpen) return null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const addCabecalho = (doc: jsPDF, casal: CasalData, titulo: string, subtitulo: string): number => {
    doc.setFillColor(...VERDE);
    doc.rect(0, 0, 210, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NossaGrana', 14, 14);

    const parceiroStr = `${casal.nomeParceiro1 || 'Parceiro 1'} & ${casal.nomeParceiro2 || 'Parceiro 2'}`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(parceiroStr, 210 - 14 - doc.getTextWidth(parceiroStr), 14);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 14, 26);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitulo, 210 - 14 - doc.getTextWidth(subtitulo), 26);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const geradoEm = `Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    doc.text(geradoEm, 14, 42);
    doc.setTextColor(0, 0, 0);

    return 48;
  };

  const getNomeResponsavel = (responsavel: string, casal: CasalData): string => {
    if (responsavel === 'PARCEIRO_1') return casal.nomeParceiro1 || 'Parceiro 1';
    if (responsavel === 'PARCEIRO_2') return casal.nomeParceiro2 || 'Parceiro 2';
    return 'Compartilhada';
  };

  const addResumoFinanceiro = (
    doc: jsPDF,
    despesas: Despesa[],
    casal: CasalData,
    startY: number,
  ): number => {
    const total = despesas.reduce((s, d) => s + Number(d.valor), 0);
    const fixas = despesas.filter(d => d.tipoDespesa === 'FIXA').reduce((s, d) => s + Number(d.valor), 0);
    const variaveis = despesas.filter(d => d.tipoDespesa === 'VARIAVEL').reduce((s, d) => s + Number(d.valor), 0);
    const imprevistas = despesas.filter(d => d.tipoDespesa === 'IMPREVISTA').reduce((s, d) => s + Number(d.valor), 0);
    const p1 = despesas.filter(d => d.responsavel === 'PARCEIRO_1').reduce((s, d) => s + Number(d.valor), 0);
    const p2 = despesas.filter(d => d.responsavel === 'PARCEIRO_2').reduce((s, d) => s + Number(d.valor), 0);
    const comp = despesas.filter(d => d.responsavel === 'COMPARTILHADA').reduce((s, d) => s + Number(d.valor), 0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro', 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total Gasto', `R$ ${formatBRL(total)}`],
        ['Despesas Fixas', `R$ ${formatBRL(fixas)}`],
        ['Despesas Variáveis', `R$ ${formatBRL(variaveis)}`],
        ['Despesas Imprevistas', `R$ ${formatBRL(imprevistas)}`],
        [casal.nomeParceiro1 || 'Parceiro 1', `R$ ${formatBRL(p1)}`],
        [casal.nomeParceiro2 || 'Parceiro 2', `R$ ${formatBRL(p2)}`],
        ['Compartilhadas', `R$ ${formatBRL(comp)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: VERDE },
      columnStyles: { 1: { halign: 'right' } },
      styles: { fontSize: 10 },
    });

    return (doc as any).lastAutoTable.finalY;
  };

  const handleGerar = async () => {
    setGerando(true);
    try {
      const casal = await casalApi.buscar(user.casalId);
      const doc = new jsPDF();

      if (tipo === 'dia') {
        const despesas = await despesasApi.filtrar(user.casalId, { dataInicio: dia, dataFim: dia });
        const dataFormatada = new Date(dia + 'T00:00:00').toLocaleDateString('pt-BR');
        let y = addCabecalho(doc, casal, 'Relatório do Dia', dataFormatada);

        if (despesas.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(150, 150, 150);
          doc.text('Nenhuma despesa registrada neste dia.', 14, y + 10);
        } else {
          y = addResumoFinanceiro(doc, despesas, casal, y) + 12;

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Despesas do Dia', 14, y);

          autoTable(doc, {
            startY: y + 4,
            head: [['Descrição', 'Categoria', 'Responsável', 'Tipo', 'Pagamento', 'Valor']],
            body: despesas.map(d => [
              d.descricao,
              d.categoriaNome,
              getNomeResponsavel(d.responsavel, casal),
              d.tipoDespesa || '-',
              d.metodoPagamento || '-',
              `R$ ${formatBRL(Number(d.valor))}`,
            ]),
            theme: 'striped',
            headStyles: { fillColor: VERDE },
            columnStyles: { 5: { halign: 'right' } },
            styles: { fontSize: 9 },
          });
        }

        doc.save(`nossagrana_dia_${dia}.pdf`);

      } else if (tipo === 'mes') {
        const [despesas, pizza, barras] = await Promise.all([
          despesasApi.listarPorMes(mes, ano),
          relatoriosApi.gastosPorCategoria(user.casalId, mes, ano),
          relatoriosApi.comparacaoParceiros(user.casalId, mes, ano),
        ]);

        let y = addCabecalho(doc, casal, 'Relatório Mensal', `${MESES[mes - 1]} de ${ano}`);

        if (despesas.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(150, 150, 150);
          doc.text('Nenhuma despesa registrada neste período.', 14, y + 10);
        } else {
          y = addResumoFinanceiro(doc, despesas, casal, y) + 12;

          // Gastos por categoria
          const categorias = Array.from(pizza.categorias as string[]);
          const valores = Array.from(pizza.valores as number[]);
          const icones = pizza.icones as Record<string, string>;

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Gastos por Categoria', 14, y);

          autoTable(doc, {
            startY: y + 4,
            head: [['Categoria', 'Total']],
            body: categorias.map((cat, i) => [`${icones[cat] || ''} ${cat}`, `R$ ${formatBRL(valores[i])}`]),
            theme: 'striped',
            headStyles: { fillColor: VERDE },
            columnStyles: { 1: { halign: 'right' } },
          });

          y = (doc as any).lastAutoTable.finalY + 12;

          // Comparação parceiros
          const categoriasBarras = Array.from(barras.categorias as string[]);
          const dados = barras.dados as Record<string, Record<string, number>>;

          if (y > 210) { doc.addPage(); y = 20; }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Comparação por Parceiro', 14, y);

          autoTable(doc, {
            startY: y + 4,
            head: [[
              'Categoria',
              casal.nomeParceiro1 || 'Parceiro 1',
              casal.nomeParceiro2 || 'Parceiro 2',
              'Compartilhada',
            ]],
            body: categoriasBarras.map(cat => [
              cat,
              `R$ ${formatBRL(dados[cat]?.PARCEIRO_1 || 0)}`,
              `R$ ${formatBRL(dados[cat]?.PARCEIRO_2 || 0)}`,
              `R$ ${formatBRL(dados[cat]?.COMPARTILHADA || 0)}`,
            ]),
            theme: 'striped',
            headStyles: { fillColor: VERDE },
            columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
          });

          // Lista completa
          doc.addPage();
          y = 20;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`Lista Completa — ${MESES[mes - 1]} de ${ano}`, 14, y);

          autoTable(doc, {
            startY: y + 4,
            head: [['Data', 'Descrição', 'Categoria', 'Responsável', 'Tipo', 'Valor']],
            body: despesas.map(d => [
              new Date(d.dataTransacao + 'T00:00:00').toLocaleDateString('pt-BR'),
              d.descricao,
              d.categoriaNome,
              getNomeResponsavel(d.responsavel, casal),
              d.tipoDespesa || '-',
              `R$ ${formatBRL(Number(d.valor))}`,
            ]),
            theme: 'striped',
            headStyles: { fillColor: VERDE },
            columnStyles: { 5: { halign: 'right' } },
            styles: { fontSize: 9 },
          });
        }

        doc.save(`nossagrana_${MESES[mes - 1].toLowerCase()}_${ano}.pdf`);

      } else {
        // Ano
        const dataInicio = `${anoSelecionado}-01-01`;
        const dataFim = `${anoSelecionado}-12-31`;

        const [evolucao, pizza, barras] = await Promise.all([
          relatoriosApi.evolucaoMensal(user.casalId, anoSelecionado),
          relatoriosApi.gastosPorCategoriaPeriodo(user.casalId, dataInicio, dataFim),
          relatoriosApi.comparacaoParceirosPeriodo(user.casalId, dataInicio, dataFim),
        ]);

        let y = addCabecalho(doc, casal, 'Relatório Anual', `${anoSelecionado}`);

        const mesesNomes = Array.from(evolucao.meses as string[]);
        const valoresEvolucao = Array.from(evolucao.valores as number[]);
        const totalAno = valoresEvolucao.reduce((s: number, v: number) => s + v, 0);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...VERDE);
        doc.text(`Total gasto em ${anoSelecionado}: R$ ${formatBRL(totalAno)}`, 14, y);
        doc.setTextColor(0, 0, 0);
        y += 12;

        // Evolução mensal
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Evolução Mensal', 14, y);

        autoTable(doc, {
          startY: y + 4,
          head: [['Mês', 'Total Gasto']],
          body: mesesNomes.map((m: string, i: number) => [m, `R$ ${formatBRL(valoresEvolucao[i])}`]),
          theme: 'striped',
          headStyles: { fillColor: VERDE },
          columnStyles: { 1: { halign: 'right' } },
        });

        y = (doc as any).lastAutoTable.finalY + 12;

        // Gastos por categoria
        const categorias = Array.from(pizza.categorias as string[]);
        const valoresPizza = Array.from(pizza.valores as number[]);
        const icones = pizza.icones as Record<string, string>;

        if (y > 210) { doc.addPage(); y = 20; }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Gastos por Categoria', 14, y);

        autoTable(doc, {
          startY: y + 4,
          head: [['Categoria', 'Total']],
          body: categorias.map((cat, i) => [`${icones[cat] || ''} ${cat}`, `R$ ${formatBRL(valoresPizza[i])}`]),
          theme: 'striped',
          headStyles: { fillColor: VERDE },
          columnStyles: { 1: { halign: 'right' } },
        });

        y = (doc as any).lastAutoTable.finalY + 12;

        // Comparação por parceiro
        const categoriasBarras = Array.from(barras.categorias as string[]);
        const dados = barras.dados as Record<string, Record<string, number>>;

        if (y > 210) { doc.addPage(); y = 20; }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Comparação por Parceiro', 14, y);

        autoTable(doc, {
          startY: y + 4,
          head: [[
            'Categoria',
            casal.nomeParceiro1 || 'Parceiro 1',
            casal.nomeParceiro2 || 'Parceiro 2',
            'Compartilhada',
            'Total',
          ]],
          body: categoriasBarras.map(cat => {
            const p1 = dados[cat]?.PARCEIRO_1 || 0;
            const p2 = dados[cat]?.PARCEIRO_2 || 0;
            const comp = dados[cat]?.COMPARTILHADA || 0;
            return [
              cat,
              `R$ ${formatBRL(p1)}`,
              `R$ ${formatBRL(p2)}`,
              `R$ ${formatBRL(comp)}`,
              `R$ ${formatBRL(p1 + p2 + comp)}`,
            ];
          }),
          theme: 'striped',
          headStyles: { fillColor: VERDE },
          columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
          },
        });

        doc.save(`nossagrana_anual_${anoSelecionado}.pdf`);
      }

      toast.success('PDF gerado com sucesso!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-bold">📄 Exportar PDF</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl leading-none transition"
            >
              ×
            </button>
          </div>
          <p className="text-emerald-100 text-sm mt-1">Escolha o período do relatório</p>
        </div>

        <div className="p-6">
          {/* Period tabs */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
            {(['dia', 'mes', 'ano'] as TipoPeriodo[]).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  tipo === t
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t === 'dia' ? '📅 Dia' : t === 'mes' ? '📆 Mês' : '📊 Ano'}
              </button>
            ))}
          </div>

          {/* Dia */}
          {tipo === 'dia' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selecione o Dia
              </label>
              <input
                type="date"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition"
              />
            </div>
          )}

          {/* Mês */}
          {tipo === 'mes' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mês</label>
                <div className="relative">
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none appearance-none"
                  >
                    {MESES.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ano</label>
                <div className="relative">
                  <select
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none appearance-none"
                  >
                    {ANOS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
                </div>
              </div>
            </div>
          )}

          {/* Ano */}
          {tipo === 'ano' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selecione o Ano
              </label>
              <div className="relative">
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none appearance-none"
                >
                  {ANOS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>
            </div>
          )}

          {/* O que inclui */}
          <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">O relatório incluirá:</p>
            {tipo === 'dia' && (
              <ul className="space-y-1">
                <li>• Resumo financeiro do dia (total, por tipo e por parceiro)</li>
                <li>• Lista detalhada de todas as despesas</li>
              </ul>
            )}
            {tipo === 'mes' && (
              <ul className="space-y-1">
                <li>• Resumo financeiro mensal</li>
                <li>• Gastos por categoria</li>
                <li>• Comparação por parceiro e categoria</li>
                <li>• Lista completa de despesas do mês</li>
              </ul>
            )}
            {tipo === 'ano' && (
              <ul className="space-y-1">
                <li>• Total gasto no ano</li>
                <li>• Evolução mês a mês</li>
                <li>• Gastos por categoria (ano completo)</li>
                <li>• Comparação por parceiro e categoria</li>
              </ul>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={gerando}
              className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGerar}
              disabled={gerando}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {gerando ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Gerando...
                </>
              ) : (
                '📄 Gerar PDF'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
