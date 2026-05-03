import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Settings, ArrowRightLeft } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { SkeletonCard } from '../components/SkeletonCard';
import { despesasApi } from '../api/despesas.api';
import { categoriasApi } from '../api/categorias.api';
import { casalApi } from '../api/casal.api';
import { compensacoesApi } from '../api/compensacoes.api';
import type { EstatisticasData, CasalData } from '../api/casal.api';
import type { Despesa, Categoria } from '../types/despesa.types';
import type { AcertoMensalResponse } from '../types/compensacao.types';
import { formatBRL } from '../utils/formatBRL';
import { CurrencyInput } from '../components/CurrencyInput';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasData | null>(null);
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [acerto, setAcerto] = useState<AcertoMensalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modoDivisao, setModoDivisao] = useState<'igual' | 'proprio'>('igual');
  const [editMeta, setEditMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(0);
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const lastClickRef = useRef<number>(0);

  const handleCardClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 400) {
      navigate('/historico');
    }
    lastClickRef.current = now;
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    setMetaInput(estatisticas?.metaMensal || 0);
  }, [estatisticas?.metaMensal]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const mes = new Date().getMonth() + 1;
      const ano = new Date().getFullYear();

      const [despesasData, categoriasData, statsData, casalData, acertoData] = await Promise.all([
        despesasApi.listarPorMes(mes, ano),
        categoriasApi.listarPorCasal(),
        casalApi.buscarEstatisticas(user.casalId, mes, ano),
        casalApi.buscar(user.casalId),
        compensacoesApi.calcularAcerto(mes, ano),
      ]);

      setDespesas(despesasData);
      setCategorias(categoriasData);
      setEstatisticas(statsData);
      setCasal(casalData);
      setAcerto(acertoData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const totalGasto = despesas.reduce((acc, desp) => acc + Number(desp.valor), 0);
  const totalOrcamentoCategorias = categorias.reduce((acc, cat) => acc + Number(cat.orcamentoMensal || 0), 0);
  const percentualOrcamento = totalOrcamentoCategorias > 0
    ? (totalGasto / totalOrcamentoCategorias) * 100
    : 0;

  const categoriasSobreOrcamento = categorias.filter(cat => {
    if (!cat.orcamentoMensal) return false;
    const gasto = despesas
      .filter(d => d.categoriaId === cat.id)
      .reduce((acc, d) => acc + Number(d.valor), 0);
    return gasto > cat.orcamentoMensal;
  });

  const saldoMes = estatisticas?.saldo || 0;
  const metaMensal = estatisticas?.metaMensal || 0;
  const percentualSaldo = metaMensal > 0 ? saldoMes / metaMensal : 0;
  const saldoStatus = saldoMes < 0 ? 'negativo' : (metaMensal > 0 && percentualSaldo <= 0.1 ? 'alerta' : 'positivo');
  const isSolo = !casal?.conviteAceito;

  const handleSalvarMeta = async () => {
    if (salvandoMeta) return;
    setSalvandoMeta(true);
    try {
      await casalApi.definirMeta(user.casalId, metaInput);
      toast.success('Meta atualizada com sucesso!');
      setEditMeta(false);
      carregarDados();
    } catch {
      toast.error('Erro ao atualizar meta');
    } finally {
      setSalvandoMeta(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div
            className="mb-8 opacity-0 animate-fadeInUp"
            style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Olá, {user.nome}! Bem-vindo de volta.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Aqui está o resumo das suas finanças
            </p>
          </div>

          {/* Alertas de Orçamento */}
          {categoriasSobreOrcamento.length > 0 && (
            <div
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl opacity-0"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.05s forwards' }}
            >
              <p className="font-semibold text-red-700 dark:text-red-400 mb-2">
                ⚠️ {categoriasSobreOrcamento.length} {categoriasSobreOrcamento.length === 1 ? 'categoria ultrapassou' : 'categorias ultrapassaram'} o orçamento este mês:
              </p>
              <div className="flex flex-wrap gap-2">
                {categoriasSobreOrcamento.map(cat => {
                  const gasto = despesas
                    .filter(d => d.categoriaId === cat.id)
                    .reduce((acc, d) => acc + Number(d.valor), 0);

                  return (
                    <span
                      key={cat.id}
                      className="text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full"
                    >
                      {cat.icone} {cat.nome} — R$ {formatBRL(gasto)} / R$ {formatBRL(cat.orcamentoMensal!)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
            {/* Esquerda - 4 cards em 2x2 */}
            <div className="xl:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Card Total Gasto */}
                <div
                  className="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[170px] flex flex-col justify-between"
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.1s forwards' }}
                >
                  <div>
                    <p className="text-red-100 text-sm font-medium mb-2">Total Gasto</p>
                    <p className="text-3xl font-bold">
                      <AnimatedNumber value={totalGasto} />
                    </p>
                  </div>
                  <p className="text-sm text-red-100 mt-4">{despesas.length} despesas este mês</p>
                </div>

                {/* Card Saldo do Mês */}
                <div
                  className={`bg-gradient-to-br ${
                    saldoStatus === 'positivo'
                      ? 'from-emerald-500 to-lime-600 dark:from-emerald-600 dark:to-lime-700'
                      : saldoStatus === 'alerta'
                        ? 'from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700'
                        : 'from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700'
                  } rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[170px] flex flex-col justify-between`}
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.2s forwards' }}
                >
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-2">Saldo do Mês</p>
                    <p className="text-3xl font-bold">
                      <AnimatedNumber value={estatisticas?.saldo || 0} prefix={saldoMes < 0 ? "R$" : "R$ "} />
                    </p>
                  </div>
                  <p className="text-sm text-white/80 mt-4">
                    {saldoStatus === 'positivo' ? 'Dentro da meta!' : saldoStatus === 'alerta' ? 'Perto do limite!' : 'Acima da meta!'}
                  </p>
                </div>

                {/* Card Meta Mensal */}
                <div
                  onDoubleClick={() => setEditMeta(true)}
                  className="group bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700 rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[170px] flex flex-col justify-between relative"
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.3s forwards' }}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <p className="text-blue-100 text-sm font-medium mb-2">Meta Mensal</p>
                      {!editMeta && (
                        <button
                          type="button"
                          onClick={() => setEditMeta(true)}
                          className="opacity-0 group-hover:opacity-100 transition text-white/90 hover:text-white"
                          title="Editar meta"
                        >
                          <Settings size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-3xl font-bold">
                      <AnimatedNumber value={estatisticas?.metaMensal || 0} />
                    </p>
                  </div>
                  {editMeta ? (
                    <div className="mt-4 space-y-2">
                      <CurrencyInput
                        value={metaInput}
                        onChange={setMetaInput}
                        className="w-full px-3 py-2 rounded-lg text-gray-900 border border-white/40 bg-white/90 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSalvarMeta}
                          disabled={salvandoMeta}
                          className="flex-1 bg-white/90 text-blue-700 font-semibold py-1.5 rounded-lg hover:bg-white transition disabled:opacity-60"
                        >
                          {salvandoMeta ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={() => { setEditMeta(false); setMetaInput(metaMensal); }}
                          className="flex-1 border border-white/70 text-white py-1.5 rounded-lg hover:bg-white/10 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Card Orçamento Geral */}
                <div
                  className="bg-gradient-to-br from-violet-500 to-fuchsia-600 dark:from-violet-600 dark:to-fuchsia-700 rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[170px] flex flex-col justify-between"
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.4s forwards' }}
                >
                  <div>
                    <p className="text-violet-100 text-sm font-medium mb-2">Orçamento Geral</p>
                    <p className="text-3xl font-bold">
                      <AnimatedNumber value={totalOrcamentoCategorias} />
                    </p>
                  </div>
                  <p className="text-sm text-violet-100 mt-4">
                    {totalOrcamentoCategorias > 0
                      ? `${percentualOrcamento.toFixed(0)}% do orçamento usado`
                      : 'Nenhum orçamento definido'}
                  </p>
                </div>
              </div>
            </div>

            {/* Direita - Gastos por Pessoa */}
            <div className="xl:col-span-5">
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-all duration-300 opacity-0 h-full min-h-[364px]"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.5s forwards' }}
              >
                <div className="flex items-start justify-between mb-6 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Gastos por Pessoa
                    </p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      Distribuição do mês
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total geral</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      R$ {formatBRL(estatisticas?.totalGeral || 0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Parceiro 1 */}
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {estatisticas?.nomeParceiro1 || 'Parceiro 1'}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        R$ {formatBRL(estatisticas?.totalParceiro1 || 0)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-sky-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${((estatisticas?.totalParceiro1 || 0) / (estatisticas?.totalGeral || 1)) * 100}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-sky-700 dark:text-sky-300 mt-2">
                      {(((estatisticas?.totalParceiro1 || 0) / (estatisticas?.totalGeral || 1)) * 100).toFixed(1)}% do total
                    </p>
                  </div>

                  {/* Parceiro 2 */}
                  {!isSolo && (
                  <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {estatisticas?.nomeParceiro2 || 'Parceiro 2'}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        R$ {formatBRL(estatisticas?.totalParceiro2 || 0)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-violet-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${((estatisticas?.totalParceiro2 || 0) / (estatisticas?.totalGeral || 1)) * 100}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-violet-700 dark:text-violet-300 mt-2">
                      {(((estatisticas?.totalParceiro2 || 0) / (estatisticas?.totalGeral || 1)) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                  )}

                  {/* Compartilhado */}
                  {!isSolo && (
                  <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Compartilhado
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        R$ {formatBRL(estatisticas?.totalCompartilhado || 0)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-teal-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${((estatisticas?.totalCompartilhado || 0) / (estatisticas?.totalGeral || 1)) * 100}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-teal-700 dark:text-teal-300 mt-2">
                      {(((estatisticas?.totalCompartilhado || 0) / (estatisticas?.totalGeral || 1)) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/60 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Itens</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{despesas.length}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/60 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Categorias</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{categorias.length}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/60 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Meta</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        R$ {formatBRL(estatisticas?.metaMensal || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divisão do Mês */}
          {!isSolo && estatisticas && (estatisticas.totalGeral || 0) > 0 && (
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 opacity-0"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.45s forwards' }}
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Divisão do Mês
                </h3>

                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
                  <button
                    onClick={() => setModoDivisao('igual')}
                    className={`px-3 py-1.5 font-medium transition ${
                      modoDivisao === 'igual'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Total ÷ 2
                  </button>
                  <button
                    onClick={() => setModoDivisao('proprio')}
                    className={`px-3 py-1.5 font-medium transition ${
                      modoDivisao === 'proprio'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Próprio + ½ compartilhado
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    nome: estatisticas.nomeParceiro1,
                    proprio: estatisticas.totalParceiro1 || 0,
                    cor: 'text-sky-600 dark:text-sky-400',
                    bg: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
                  },
                  {
                    nome: estatisticas.nomeParceiro2,
                    proprio: estatisticas.totalParceiro2 || 0,
                    cor: 'text-violet-600 dark:text-violet-400',
                    bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
                  },
                ].map((p) => {
                  const metadeCompartilhado = (estatisticas.totalCompartilhado || 0) / 2;
                  const valor = modoDivisao === 'igual'
                    ? (estatisticas.totalGeral || 0) / 2
                    : p.proprio + metadeCompartilhado;

                  return (
                    <div key={p.nome} className={`rounded-xl p-4 border ${p.bg}`}>
                      <p className={`text-sm font-semibold ${p.cor} mb-1`}>{p.nome}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {formatBRL(valor)}
                      </p>

                      {modoDivisao === 'proprio' && (
                        <div className="mt-2 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                          <p>Próprio: R$ {formatBRL(p.proprio)}</p>
                          <p>½ compartilhado: R$ {formatBRL(metadeCompartilhado)}</p>
                        </div>
                      )}

                      {modoDivisao === 'igual' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          metade de R$ {formatBRL(estatisticas.totalGeral || 0)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acerto do Mês */}
          {/* Comentário bobo para forçar um novo deploy */}
          {!isSolo && acerto && !acerto.solo && (
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 opacity-0"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.5s forwards' }}
            >
              <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Acerto do Mês
                  </h3>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  cálculo em etapas: mês + compensações
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {[acerto.parceiro1, acerto.parceiro2].filter(Boolean).map((p) => {
                  if (!p) return null;

                  const valorPago = Number(p.despesasPagas || 0);
                  const cotaBase = Number(acerto.cotaIdeal || 0);
                  const valorLiquidoDevido = valorPago - cotaBase;
                  const compensacoes = Number(p.compensacoesConcedidas || 0) - Number(p.compensacoesRecebidas || 0);
                  const valorTotalDevido = valorLiquidoDevido + compensacoes;
                  const recebe = valorTotalDevido > 0;
                  const deve = valorTotalDevido < 0;
                  const cardClasses = recebe
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : deve
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700';
                  const titleClasses = recebe
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : deve
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-gray-700 dark:text-gray-300';
                  const colorByValue = (value: number) => (
                    value > 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : value < 0
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-gray-700 dark:text-gray-300'
                  );
                  const signedCurrency = (value: number) => (
                    `${value > 0 ? '+ ' : value < 0 ? '- ' : ''}R$ ${formatBRL(Math.abs(value))}`
                  );

                  return (
                    <div key={p.usuarioId} className={`rounded-xl p-4 border ${cardClasses}`}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <p className={`text-sm font-semibold ${titleClasses}`}>{p.nome}</p>
                        <span className={`text-xs font-semibold ${titleClasses}`}>
                          {recebe ? 'A receber' : deve ? 'A pagar' : 'Quite'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between gap-3">
                          <span>1. Valor pago</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">R$ {formatBRL(valorPago)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>2. Cota base (50/50)</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">R$ {formatBRL(cotaBase)}</span>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-2">
                          <span>3. Valor líquido devido</span>
                          <span className={`font-semibold ${colorByValue(valorLiquidoDevido)}`}>
                            {signedCurrency(valorLiquidoDevido)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>4. Compensações</span>
                          <span className={`font-semibold ${colorByValue(compensacoes)}`}>
                            {signedCurrency(compensacoes)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-2">
                          <span className="font-medium">5. Valor total devido</span>
                          <span className={`font-bold ${colorByValue(valorTotalDevido)}`}>
                            {signedCurrency(valorTotalDevido)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const p1 = acerto.parceiro1;
                const p2 = acerto.parceiro2;

                if (!p1 || !p2) return null;

                const cotaBase = Number(acerto.cotaIdeal || 0);
                const valorTotalDevidoP1 = (
                  Number(p1.despesasPagas || 0) - cotaBase
                ) + (
                  Number(p1.compensacoesConcedidas || 0) - Number(p1.compensacoesRecebidas || 0)
                );
                const valorTotalDevidoP2 = (
                  Number(p2.despesasPagas || 0) - cotaBase
                ) + (
                  Number(p2.compensacoesConcedidas || 0) - Number(p2.compensacoesRecebidas || 0)
                );
                const threshold = 0.01;
                const parceiros = [
                  { nome: p1.nome, valor: valorTotalDevidoP1 },
                  { nome: p2.nome, valor: valorTotalDevidoP2 },
                ];
                const positivos = parceiros
                  .filter((parceiro) => parceiro.valor > threshold)
                  .sort((a, b) => b.valor - a.valor);
                const negativos = parceiros
                  .filter((parceiro) => parceiro.valor < -threshold)
                  .sort((a, b) => a.valor - b.valor);

                if (positivos.length === 0 && negativos.length === 0) {
                  return (
                    <div className="rounded-xl p-4 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                        Sem acerto pendente neste mês
                      </p>
                    </div>
                  );
                }

                const credor = positivos[0]
                  ?? parceiros.find((parceiro) => Math.abs(parceiro.valor) < threshold)
                  ?? parceiros[0];
                const devedor = negativos[0]
                  ?? parceiros.find((parceiro) => parceiro.nome !== credor.nome)
                  ?? parceiros[1];
                const valorReferencia = positivos[0] ?? negativos[0];
                const valorTransacao = positivos.length > 0 && negativos.length > 0
                  ? Math.min(Math.abs(credor.valor), Math.abs(devedor.valor))
                  : Math.abs(valorReferencia?.valor || 0);

                if (valorTransacao < threshold) {
                  return (
                    <div className="rounded-xl p-4 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                        Sem acerto pendente neste mês
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="rounded-xl p-4 text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resultado final</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      <span className="text-red-600 dark:text-red-400">{devedor.nome}</span>
                      {' deve '}
                      <span className="text-emerald-600 dark:text-emerald-400">R$ {formatBRL(valorTransacao)}</span>
                      {' para '}
                      <span className="text-emerald-600 dark:text-emerald-400">{credor.nome}</span>
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Botão Nova Despesa */}
          <div
            className="mb-8 opacity-0"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.5s forwards' }}
          >
            <button
              onClick={() => navigate('/nova-despesa')}
              className="bg-emerald-600 dark:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Nova Despesa
            </button>
          </div>

          {/* Últimas Despesas */}
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 opacity-0"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.6s forwards' }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Últimas Despesas
            </h3>

            {despesas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Nenhuma despesa cadastrada ainda
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Clique em "Nova Despesa" para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...despesas]
                  .sort((a, b) => {
                    const timeA = a.dataCriacao
                      ? new Date(a.dataCriacao).getTime()
                      : new Date(`${a.dataTransacao}T00:00:00`).getTime();

                    const timeB = b.dataCriacao
                      ? new Date(b.dataCriacao).getTime()
                      : new Date(`${b.dataTransacao}T00:00:00`).getTime();

                    const dateDiff = timeB - timeA;
                    if (dateDiff !== 0) return dateDiff;
                    return b.id - a.id;
                  })
                  .slice(0, 5)
                  .map((despesa) => {
                    const categoria = categorias.find(c => c.id === despesa.categoriaId);

                    return (
                      <div
                        key={despesa.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer select-none"
                        onClick={handleCardClick}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{categoria?.icone || '📦'}</div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {despesa.descricao}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {categoria?.nome || 'Sem categoria'} • {new Date(despesa.dataTransacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                            {despesa.observacoes && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {despesa.observacoes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            R$ {formatBRL(Number(despesa.valor))}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {despesa.metodoPagamento}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
