import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Settings, ArrowRightLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Sidebar } from '../components/Sidebar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { SkeletonCard } from '../components/SkeletonCard';
import { despesasApi } from '../api/despesas.api';
import { categoriasApi } from '../api/categorias.api';
import { casalApi } from '../api/casal.api';
import { compensacoesApi } from '../api/compensacoes.api';
import { preferenciasApi, CARDS_DISPONIVEIS, type CardId } from '../api/preferencias.api';
import type { EstatisticasData, CasalData } from '../api/casal.api';
import type { Despesa, Categoria } from '../types/despesa.types';
import type { AcertoMensalResponse } from '../types/compensacao.types';
import { formatBRL } from '../utils/formatBRL';
import { CurrencyInput } from '../components/CurrencyInput';

const iniciaisDoNome = (nome?: string | null) => {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase() || partes[0]?.[0]?.toUpperCase() || '?';
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasData | null>(null);
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [acerto, setAcerto] = useState<AcertoMensalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMeta, setEditMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(0);
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [corDestaque, setCorDestaque] = useState('#10b981');
  const [imagemBannerUrl, setImagemBannerUrl] = useState<string | null>(null);
  const [ordemCards, setOrdemCards] = useState<CardId[]>(CARDS_DISPONIVEIS.map(c => c.id));
  const [cardsEscondidos, setCardsEscondidos] = useState<Set<CardId>>(new Set());

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
    carregarPreferencias();
  }, []);

  const carregarPreferencias = async () => {
    try {
      const pref = await preferenciasApi.buscar();
      if (pref.corDestaque) {
        setCorDestaque(pref.corDestaque);
        document.documentElement.style.setProperty('--cor-destaque', pref.corDestaque);
      }
      if (pref.ordemCards) {
        try {
          const arr = JSON.parse(pref.ordemCards) as CardId[];
          const validos = arr.filter(id => CARDS_DISPONIVEIS.some(c => c.id === id));
          const faltando = CARDS_DISPONIVEIS.map(c => c.id).filter(id => !validos.includes(id));
          setOrdemCards([...validos, ...faltando]);
        } catch {}
      }
      if (pref.cardsEscondidos) {
        try {
          setCardsEscondidos(new Set(JSON.parse(pref.cardsEscondidos) as CardId[]));
        } catch {}
      }
      if (pref.temImagemFundo) {
        const url = await preferenciasApi.imagemFundoBlobUrl();
        if (url) setImagemBannerUrl(url);
      }
    } catch {
      // sem preferências ainda, ok
    }
  };

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

  const cardOrder = (id: CardId): number => {
    const idx = ordemCards.indexOf(id);
    return idx >= 0 ? idx : 99;
  };
  const cardVisivel = (id: CardId) => !cardsEscondidos.has(id);

  const dadosPorCategoria = categorias
    .map(cat => {
      const valor = despesas
        .filter(d => d.categoriaId === cat.id)
        .reduce((s, d) => s + Number(d.valor), 0);
      return {
        nome: cat.nome,
        icone: cat.icone,
        valor,
        cor: cat.cor || '#10b981',
      };
    })
    .filter(d => d.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const totalGeral = estatisticas?.totalGeral || 0;

  const renderParceiroCard = (
    nome: string,
    valorGasto: number,
    barColor: string,
    delay: string,
  ) => (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-all duration-300 opacity-0"
      style={{ animation: `fadeInUp 0.6s ease-out ${delay} forwards` }}
    >
      <div
        className="h-24 bg-cover bg-center relative"
        style={
          imagemBannerUrl
            ? { backgroundImage: `url(${imagemBannerUrl})` }
            : { background: `linear-gradient(135deg, ${barColor}, var(--cor-destaque, #10b981))` }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="px-6 pb-5 -mt-8 relative">
        <div className="flex items-end gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-white dark:border-gray-800 shadow-md"
            style={{ backgroundColor: barColor }}
          >
            {iniciaisDoNome(nome)}
          </div>
          <div className="pb-1.5 min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{nome}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Finanças do mês</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gastou este mês</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {formatBRL(valorGasto)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {totalGeral > 0 ? `${((valorGasto / totalGeral) * 100).toFixed(0)}%` : '0%'}
            </p>
            <p className="text-[10px] text-gray-400">do total</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden"
      style={{ ['--cor-destaque' as any]: corDestaque }}
    >
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div
            className="mb-6 opacity-0 flex items-start justify-between gap-4 flex-wrap"
            style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Olá, {user.nome}! Bem-vindo de volta.
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Aqui está o resumo das suas finanças
              </p>
            </div>
            <button
              onClick={() => navigate('/nova-despesa')}
              className="text-white px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 transition shadow-md flex items-center gap-2"
              style={{ backgroundColor: 'var(--cor-destaque, #10b981)' }}
            >
              <span className="text-xl">+</span>
              Nova Despesa
            </button>
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

          {/* Linha 1: Cards dos Parceiros */}
          <div className={`grid gap-6 mb-6 ${isSolo ? 'grid-cols-1 md:max-w-md' : 'grid-cols-1 md:grid-cols-2'}`}>
            {renderParceiroCard(
              estatisticas?.nomeParceiro1 || casal?.nomeParceiro1 || 'Parceiro 1',
              estatisticas?.totalParceiro1 || 0,
              '#0ea5e9',
              '0.1s',
            )}
            {!isSolo && renderParceiroCard(
              estatisticas?.nomeParceiro2 || casal?.nomeParceiro2 || 'Parceiro 2',
              estatisticas?.totalParceiro2 || 0,
              '#8b5cf6',
              '0.2s',
            )}
          </div>

          {/* Linha 2: 2x2 de cards principais + Acerto do Mês */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
            <div className="xl:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cardVisivel('totalGasto') && (
                  <div
                    className="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 rounded-2xl p-5 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[150px] flex flex-col justify-between"
                    style={{ animation: 'fadeInUp 0.6s ease-out 0.3s forwards', order: cardOrder('totalGasto') }}
                  >
                    <div>
                      <p className="text-red-100 text-xs font-medium mb-1">Total Gasto</p>
                      <p className="text-2xl font-bold">
                        <AnimatedNumber value={totalGasto} />
                      </p>
                    </div>
                    <p className="text-xs text-red-100 mt-3">{despesas.length} despesas este mês</p>
                  </div>
                )}

                {cardVisivel('saldoMes') && (
                  <div
                    className={`bg-gradient-to-br ${
                      saldoStatus === 'positivo'
                        ? 'from-emerald-500 to-lime-600 dark:from-emerald-600 dark:to-lime-700'
                        : saldoStatus === 'alerta'
                          ? 'from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700'
                          : 'from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700'
                    } rounded-2xl p-5 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[150px] flex flex-col justify-between`}
                    style={{ animation: 'fadeInUp 0.6s ease-out 0.35s forwards', order: cardOrder('saldoMes') }}
                  >
                    <div>
                      <p className="text-white/80 text-xs font-medium mb-1">Saldo do Mês</p>
                      <p className="text-2xl font-bold">
                        <AnimatedNumber value={estatisticas?.saldo || 0} prefix={saldoMes < 0 ? "R$" : "R$ "} />
                      </p>
                    </div>
                    <p className="text-xs text-white/80 mt-3">
                      {saldoStatus === 'positivo' ? 'Dentro da meta!' : saldoStatus === 'alerta' ? 'Perto do limite!' : 'Acima da meta!'}
                    </p>
                  </div>
                )}

                {cardVisivel('metaMensal') && (
                  <div
                    onDoubleClick={() => setEditMeta(true)}
                    className="group bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700 rounded-2xl p-5 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[150px] flex flex-col justify-between relative"
                    style={{ animation: 'fadeInUp 0.6s ease-out 0.4s forwards', order: cardOrder('metaMensal') }}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <p className="text-blue-100 text-xs font-medium mb-1">Meta Mensal</p>
                        {!editMeta && (
                          <button
                            type="button"
                            onClick={() => setEditMeta(true)}
                            className="opacity-0 group-hover:opacity-100 transition text-white/90 hover:text-white"
                            title="Editar meta"
                          >
                            <Settings size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-2xl font-bold">
                        <AnimatedNumber value={estatisticas?.metaMensal || 0} />
                      </p>
                    </div>
                    {editMeta ? (
                      <div className="mt-3 space-y-2">
                        <CurrencyInput
                          value={metaInput}
                          onChange={setMetaInput}
                          className="w-full px-3 py-2 rounded-lg text-gray-900 border border-white/40 bg-white/90 focus:outline-none text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSalvarMeta}
                            disabled={salvandoMeta}
                            className="flex-1 bg-white/90 text-blue-700 font-semibold py-1 rounded-lg hover:bg-white transition disabled:opacity-60 text-xs"
                          >
                            {salvandoMeta ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={() => { setEditMeta(false); setMetaInput(metaMensal); }}
                            className="flex-1 border border-white/70 text-white py-1 rounded-lg hover:bg-white/10 transition text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {cardVisivel('orcamentoGeral') && (
                  <div
                    className="bg-gradient-to-br from-violet-500 to-fuchsia-600 dark:from-violet-600 dark:to-fuchsia-700 rounded-2xl p-5 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 min-h-[150px] flex flex-col justify-between"
                    style={{ animation: 'fadeInUp 0.6s ease-out 0.45s forwards', order: cardOrder('orcamentoGeral') }}
                  >
                    <div>
                      <p className="text-violet-100 text-xs font-medium mb-1">Orçamento Geral</p>
                      <p className="text-2xl font-bold">
                        <AnimatedNumber value={totalOrcamentoCategorias} />
                      </p>
                    </div>
                    <p className="text-xs text-violet-100 mt-3">
                      {totalOrcamentoCategorias > 0
                        ? `${percentualOrcamento.toFixed(0)}% do orçamento usado`
                        : 'Nenhum orçamento definido'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Acerto do Mês ao lado */}
            <div className="xl:col-span-5">
              {cardVisivel('acertoMes') && !isSolo && acerto && !acerto.solo ? (
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 opacity-0 h-full"
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.5s forwards' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowRightLeft size={16} style={{ color: 'var(--cor-destaque, #10b981)' }} />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Acerto do Mês
                    </h3>
                  </div>

                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 p-3 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Total do mês</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          R$ {formatBRL(Number(acerto.totalDespesasMes || 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Cota por pessoa</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          R$ {formatBRL(Number(acerto.cotaIdeal || 0))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const p1 = acerto.parceiro1;
                    const p2 = acerto.parceiro2;
                    if (!p1 || !p2) return null;

                    const cotaBase = Number(acerto.cotaIdeal || 0);
                    const valorTotalDevidoP1 = (Number(p1.despesasPagas || 0) - cotaBase)
                      + (Number(p1.compensacoesConcedidas || 0) - Number(p1.compensacoesRecebidas || 0));
                    const valorTotalDevidoP2 = (Number(p2.despesasPagas || 0) - cotaBase)
                      + (Number(p2.compensacoesConcedidas || 0) - Number(p2.compensacoesRecebidas || 0));
                    const threshold = 0.01;
                    const parceiros = [
                      { nome: p1.nome, valor: valorTotalDevidoP1 },
                      { nome: p2.nome, valor: valorTotalDevidoP2 },
                    ];
                    const positivos = parceiros.filter((p) => p.valor > threshold).sort((a, b) => b.valor - a.valor);
                    const negativos = parceiros.filter((p) => p.valor < -threshold).sort((a, b) => a.valor - b.valor);

                    if (positivos.length === 0 && negativos.length === 0) {
                      return (
                        <div className="rounded-xl p-4 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                            ✓ Sem acerto pendente
                          </p>
                        </div>
                      );
                    }

                    const credor = positivos[0] ?? parceiros[0];
                    const devedor = negativos[0] ?? parceiros[1];
                    const valorReferencia = positivos[0] ?? negativos[0];
                    const valorTransacao = positivos.length > 0 && negativos.length > 0
                      ? Math.min(Math.abs(credor.valor), Math.abs(devedor.valor))
                      : Math.abs(valorReferencia?.valor || 0);

                    if (valorTransacao < threshold) {
                      return (
                        <div className="rounded-xl p-4 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                            ✓ Sem acerto pendente
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">Resultado final</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white text-center leading-relaxed">
                          <span className="text-red-600 dark:text-red-400">{devedor.nome}</span>
                          {' deve '}
                          <br />
                          <span className="text-lg" style={{ color: 'var(--cor-destaque, #10b981)' }}>
                            R$ {formatBRL(valorTransacao)}
                          </span>
                          {' para '}
                          <span style={{ color: 'var(--cor-destaque, #10b981)' }}>{credor.nome}</span>
                        </p>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => navigate('/compensacoes')}
                    className="mt-4 w-full text-xs text-center text-gray-500 dark:text-gray-400 hover:underline"
                  >
                    Ver detalhamento completo →
                  </button>
                </div>
              ) : (
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 h-full flex flex-col justify-center items-center text-center opacity-0"
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.5s forwards' }}
                >
                  <ArrowRightLeft size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isSolo ? 'Convide seu parceiro para ver o acerto do mês' : 'Sem despesas compartilhadas neste mês'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Linha 3: Distribuição do Mês (Gastos por Pessoa) */}
          {cardVisivel('gastosPorPessoa') && !isSolo && (
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6 opacity-0"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.55s forwards' }}
            >
              <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Distribuição do mês</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Gastos por pessoa</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="px-3">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Itens</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{despesas.length}</p>
                  </div>
                  <div className="px-3">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Categorias</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{categorias.length}</p>
                  </div>
                  <div className="px-3">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Total</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">R$ {formatBRL(totalGeral)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {estatisticas?.nomeParceiro1 || 'Parceiro 1'}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      R$ {formatBRL(estatisticas?.totalParceiro1 || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((estatisticas?.totalParceiro1 || 0) / (totalGeral || 1)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-sky-700 dark:text-sky-300 mt-2">
                    {(((estatisticas?.totalParceiro1 || 0) / (totalGeral || 1)) * 100).toFixed(1)}% do total
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {estatisticas?.nomeParceiro2 || 'Parceiro 2'}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      R$ {formatBRL(estatisticas?.totalParceiro2 || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((estatisticas?.totalParceiro2 || 0) / (totalGeral || 1)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-violet-700 dark:text-violet-300 mt-2">
                    {(((estatisticas?.totalParceiro2 || 0) / (totalGeral || 1)) * 100).toFixed(1)}% do total
                  </p>
                </div>

                <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compartilhado</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      R$ {formatBRL(estatisticas?.totalCompartilhado || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((estatisticas?.totalCompartilhado || 0) / (totalGeral || 1)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-teal-700 dark:text-teal-300 mt-2">
                    {(((estatisticas?.totalCompartilhado || 0) / (totalGeral || 1)) * 100).toFixed(1)}% do total
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Linha 4: Últimas Despesas + Pizza */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cardVisivel('ultimasDespesas') && (
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 opacity-0"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.6s forwards' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Últimas Despesas</h3>
                  <button
                    onClick={() => navigate('/historico')}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--cor-destaque, #10b981)' }}
                  >
                    Ver todas →
                  </button>
                </div>

                {despesas.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma despesa cadastrada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...despesas]
                      .sort((a, b) => {
                        const timeA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : new Date(`${a.dataTransacao}T00:00:00`).getTime();
                        const timeB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : new Date(`${b.dataTransacao}T00:00:00`).getTime();
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
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer select-none"
                            onClick={handleCardClick}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="text-2xl shrink-0">{categoria?.icone || '📦'}</div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{despesa.descricao}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {categoria?.nome || 'Sem categoria'} • {new Date(despesa.dataTransacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="font-bold text-sm text-gray-900 dark:text-white">R$ {formatBRL(Number(despesa.valor))}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">{despesa.metodoPagamento}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 opacity-0"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.65s forwards' }}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Despesas por Categoria</h3>

              {dadosPorCategoria.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Sem dados para mostrar</p>
                </div>
              ) : (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dadosPorCategoria}
                        dataKey="valor"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ percent }) => percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {dadosPorCategoria.map((entry, idx) => (
                          <Cell key={idx} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `R$ ${formatBRL(Number(value) || 0)}`}
                        contentStyle={{
                          backgroundColor: 'rgba(31, 41, 55, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
