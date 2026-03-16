import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { relatoriosApi } from '../api/relatorios.api';
import { casalApi } from '../api/casal.api';
import { formatBRL } from '../utils/formatBRL';
import { Sidebar } from '../components/Sidebar';
import type { CasalData } from '../api/casal.api';

interface DadosPizza {
  categoria: string;
  valor: number;
  cor: string;
  icone: string;
}

interface DadosLinha {
  mes: string;
  valor: number;
}

interface DadosBarras {
  categoria: string;
  PARCEIRO_1: number;
  PARCEIRO_2: number;
  COMPARTILHADA: number;
}

export const Relatorios = () => {
  const navigate = useNavigate();
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [modoPeriodo, setModoPeriodo] = useState<'mes' | 'personalizado'>('mes');
  const [periodoInicio, setPeriodoInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [periodoFim, setPeriodoFim] = useState(new Date().toISOString().split('T')[0]);
  const [dadosPizza, setDadosPizza] = useState<DadosPizza[]>([]);
  const [dadosLinha, setDadosLinha] = useState<DadosLinha[]>([]);
  const [dadosBarras, setDadosBarras] = useState<DadosBarras[]>([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    carregarDados();
  }, [mes, ano, modoPeriodo, periodoInicio, periodoFim]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const pizzaPromise = modoPeriodo === 'personalizado'
        ? relatoriosApi.gastosPorCategoriaPeriodo(user.casalId, periodoInicio, periodoFim)
        : relatoriosApi.gastosPorCategoria(user.casalId, mes, ano);
      const barrasPromise = modoPeriodo === 'personalizado'
        ? relatoriosApi.comparacaoParceirosPeriodo(user.casalId, periodoInicio, periodoFim)
        : relatoriosApi.comparacaoParceiros(user.casalId, mes, ano);
      const [pizza, linha, barras, casalData] = await Promise.all([
        pizzaPromise,
        relatoriosApi.evolucaoMensal(user.casalId, ano),
        barrasPromise,
        casalApi.buscar(user.casalId),
      ]);

      // Processar pizza
      const categorias = Array.from(pizza.categorias as string[]);
      const valores = Array.from(pizza.valores as number[]);
      const pizzaData: DadosPizza[] = categorias.map((cat, i) => ({
        categoria: cat,
        valor: valores[i],
        cor: (pizza.cores as Record<string, string>)[cat] || '#10b981',
        icone: (pizza.icones as Record<string, string>)[cat] || '📦',
      }));
      setDadosPizza(pizzaData);

      // Processar linha
      const linhaData: DadosLinha[] = (linha.meses as string[]).map((m: string, i: number) => ({
        mes: m,
        valor: (linha.valores as number[])[i],
      }));
      setDadosLinha(linhaData);

      // Processar barras
      const categoriasBarras = Array.from(barras.categorias as string[]);
      const dados = barras.dados as Record<string, Record<string, number>>;
      const barrasData: DadosBarras[] = categoriasBarras.map((cat) => ({
        categoria: cat,
        PARCEIRO_1: dados[cat]?.PARCEIRO_1 || 0,
        PARCEIRO_2: dados[cat]?.PARCEIRO_2 || 0,
        COMPARTILHADA: dados[cat]?.COMPARTILHADA || 0,
      }));
      setDadosBarras(barrasData);

      setCasal(casalData);
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const periodo = modoPeriodo === 'mes'
      ? `${meses[mes - 1]} ${ano}`
      : `${periodoInicio} a ${periodoFim}`;

    doc.setFontSize(18);
    doc.text('Relatório NossaGrana', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${periodo}`, 14, 28);

    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text('Gastos por Categoria', 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [['Categoria', 'Valor']],
      body: dadosPizza.map(d => [d.icone + ' ' + d.categoria, `R$ ${formatBRL(d.valor)}`]),
      theme: 'striped',
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text(`Evolução Mensal ${ano}`, 14, y1);
    autoTable(doc, {
      startY: y1 + 4,
      head: [['Mês', 'Total Gasto']],
      body: dadosLinha.map(d => [d.mes, `R$ ${formatBRL(d.valor)}`]),
      theme: 'striped',
    });

    const y2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Comparação por Parceiro e Categoria', 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Categoria', casal?.nomeParceiro1 || 'Parceiro 1', casal?.nomeParceiro2 || 'Parceiro 2', 'Compartilhada']],
      body: dadosBarras.map(d => [
        d.categoria,
        `R$ ${formatBRL(d.PARCEIRO_1)}`,
        `R$ ${formatBRL(d.PARCEIRO_2)}`,
        `R$ ${formatBRL(d.COMPARTILHADA)}`,
      ]),
      theme: 'striped',
    });

    doc.save(`relatorio_${periodo.replace(/\s/g, '_')}.pdf`);
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const formatCurrency = (value: number) => `R$ ${formatBRL(value)}`;

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '12px',
    color: '#f9fafb',
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Análise visual das suas finanças</p>
            </div>
            <button
              onClick={exportarPDF}
              className="bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition font-medium"
            >
              📄 Exportar PDF
            </button>
          </div>

          {/* Seletores */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s forwards' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-sm">
                <button
                  onClick={() => setModoPeriodo('mes')}
                  className={`px-4 py-2 font-medium transition ${modoPeriodo === 'mes' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Mês/Ano
                </button>
                <button
                  onClick={() => setModoPeriodo('personalizado')}
                  className={`px-4 py-2 font-medium transition ${modoPeriodo === 'personalizado' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Período Personalizado
                </button>
              </div>
            </div>

            {modoPeriodo === 'mes' ? (
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mês</label>
                  <div className="relative">
                    <select
                      value={mes}
                      onChange={(e) => setMes(Number(e.target.value))}
                      className="px-4 py-2 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none appearance-none"
                    >
                      {meses.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Ano</label>
                  <div className="relative">
                    <select
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value))}
                      className="px-4 py-2 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none appearance-none"
                    >
                      {[2023, 2024, 2025, 2026].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">De</label>
                  <input
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Até</label>
                  <input
                    type="date"
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse h-80">
                  <div className="h-5 w-40 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pizza - Gastos por Categoria */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s forwards' }}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🥧 Gastos por Categoria</h3>
                  {dadosPizza.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      Nenhum dado para este período
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={dadosPizza}
                          dataKey="valor"
                          nameKey="categoria"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ categoria, percent }: any) => `${categoria} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                          isAnimationActive={true}
                          animationBegin={300}
                          animationDuration={1200}
                        >
                          {dadosPizza.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={tooltipStyle} itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Gráfico de Linha - Evolução Mensal */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s forwards' }}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📈 Evolução Mensal {ano}</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dadosLinha}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        name="Total Gasto"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                        isAnimationActive={true}
                        animationBegin={300}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Barras - Comparação de Parceiros */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s forwards' }}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Comparação por Parceiro e Categoria</h3>
                {dadosBarras.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Nenhum dado para este período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosBarras}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="categoria" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={tooltipStyle} itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Legend />
                      <Bar dataKey="PARCEIRO_1" name={casal?.nomeParceiro1 || 'Parceiro 1'} fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={true} animationBegin={200} animationDuration={1000} />
                      <Bar dataKey="PARCEIRO_2" name={casal?.nomeParceiro2 || 'Parceiro 2'} fill="#8b5cf6" radius={[4, 4, 0, 0]} isAnimationActive={true} animationBegin={400} animationDuration={1000} />
                      <Bar dataKey="COMPARTILHADA" name="Compartilhada" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={true} animationBegin={600} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
