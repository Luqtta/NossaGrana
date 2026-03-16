import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { SkeletonCard } from '../components/SkeletonCard';
import { despesasApi } from '../api/despesas.api';
import { categoriasApi } from '../api/categorias.api';
import { casalApi } from '../api/casal.api';
import type { EstatisticasData } from '../api/casal.api';
import type { Despesa, Categoria } from '../types/despesa.types';
import { formatBRL } from '../utils/formatBRL';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modoDivisao, setModoDivisao] = useState<'igual' | 'proprio'>('igual');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      navigate('/historico');
    }
    lastTapRef.current = now;
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const mes = new Date().getMonth() + 1;
      const ano = new Date().getFullYear();
      
      const [despesasData, categoriasData, statsData] = await Promise.all([
        despesasApi.listarPorMes(mes, ano),
        categoriasApi.listarPorCasal(),
        casalApi.buscarEstatisticas(user.casalId, mes, ano),
      ]);
      
      setDespesas(despesasData);
      setCategorias(categoriasData);
      setEstatisticas(statsData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const totalGasto = despesas.reduce((acc, desp) => acc + Number(desp.valor), 0);

  const categoriasSobreOrcamento = categorias.filter(cat => {
    if (!cat.orcamentoMensal) return false;
    const gasto = despesas
      .filter(d => d.categoriaId === cat.id)
      .reduce((acc, d) => acc + Number(d.valor), 0);
    return gasto > cat.orcamentoMensal;
  });

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
          <div className="mb-8 opacity-0 animate-fadeInUp" style={{animation: 'fadeInUp 0.6s ease-out forwards'}}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Olá, {user.nome}! Bem-vindo de volta.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Aqui está o resumo das suas finanças</p>
          </div>

          {/* Alertas de Orçamento */}
          {categoriasSobreOrcamento.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.05s forwards'}}>
              <p className="font-semibold text-red-700 dark:text-red-400 mb-2">
                ⚠️ {categoriasSobreOrcamento.length} {categoriasSobreOrcamento.length === 1 ? 'categoria ultrapassou' : 'categorias ultrapassaram'} o orçamento este mês:
              </p>
              <div className="flex flex-wrap gap-2">
                {categoriasSobreOrcamento.map(cat => {
                  const gasto = despesas.filter(d => d.categoriaId === cat.id).reduce((acc, d) => acc + Number(d.valor), 0);
                  return (
                    <span key={cat.id} className="text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full">
                      {cat.icone} {cat.nome} — R$ {formatBRL(gasto)} / R$ {formatBRL(cat.orcamentoMensal!)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card Total Gasto */}
            <div className="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.1s forwards'}}>
              <p className="text-red-100 text-sm font-medium mb-2">Total Gasto</p>
              <p className="text-3xl font-bold">
                <AnimatedNumber value={totalGasto} />
              </p>
              <p className="text-sm text-red-100 mt-1">{despesas.length} despesas este mês</p>
            </div>

            {/* Card Meta Mensal */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.2s forwards'}}>
              <p className="text-blue-100 text-sm font-medium mb-2">Meta Mensal</p>
              <p className="text-3xl font-bold">
                <AnimatedNumber value={estatisticas?.metaMensal || 0} />
              </p>
              <p className="text-sm text-blue-100 mt-1">Objetivo do mês</p>
            </div>

            {/* Card Saldo */}
            <div className={`bg-gradient-to-br ${(estatisticas?.saldo || 0) >= 0 ? 'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700' : 'from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700'} rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0`} style={{animation: 'fadeInUp 0.6s ease-out 0.3s forwards'}}>
              <p className="text-white/80 text-sm font-medium mb-2">Saldo do Mês</p>
              <p className="text-3xl font-bold">
                <AnimatedNumber value={Math.abs(estatisticas?.saldo || 0)} />
              </p>
              <p className="text-sm text-white/80 mt-1">
                {(estatisticas?.saldo || 0) >= 0 ? 'Dentro da meta!' : 'Acima da meta!'}
              </p>
            </div>

            {/* Card Gastos por Parceiro */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-all duration-300 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.4s forwards'}}>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Gastos por Pessoa</p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{estatisticas?.nomeParceiro1 || 'Parceiro 1'}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      R$ {formatBRL(estatisticas?.totalParceiro1 || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{width: `${((estatisticas?.totalParceiro1 || 0) / (estatisticas?.totalGeral || 1)) * 100}%`}}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{estatisticas?.nomeParceiro2 || 'Parceiro 2'}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      R$ {formatBRL(estatisticas?.totalParceiro2 || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                      style={{width: `${((estatisticas?.totalParceiro2 || 0) / (estatisticas?.totalGeral || 1)) * 100}%`}}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Compartilhado</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      R$ {formatBRL(estatisticas?.totalCompartilhado || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{width: `${((estatisticas?.totalCompartilhado || 0) / (estatisticas?.totalGeral || 1)) * 100}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divisão do Mês */}
          {estatisticas && (estatisticas.totalGeral || 0) > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.45s forwards'}}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Divisão do Mês</h3>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
                  <button
                    onClick={() => setModoDivisao('igual')}
                    className={`px-3 py-1.5 font-medium transition ${modoDivisao === 'igual' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    Total ÷ 2
                  </button>
                  <button
                    onClick={() => setModoDivisao('proprio')}
                    className={`px-3 py-1.5 font-medium transition ${modoDivisao === 'proprio' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    Próprio + ½ compartilhado
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { nome: estatisticas.nomeParceiro1, proprio: estatisticas.totalParceiro1 || 0, cor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
                  { nome: estatisticas.nomeParceiro2, proprio: estatisticas.totalParceiro2 || 0, cor: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
                ].map((p) => {
                  const metadeCompartilhado = (estatisticas.totalCompartilhado || 0) / 2;
                  const valor = modoDivisao === 'igual'
                    ? (estatisticas.totalGeral || 0) / 2
                    : p.proprio + metadeCompartilhado;
                  return (
                    <div key={p.nome} className={`rounded-xl p-4 border ${p.bg}`}>
                      <p className={`text-sm font-semibold ${p.cor} mb-1`}>{p.nome}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {formatBRL(valor)}</p>
                      {modoDivisao === 'proprio' && (
                        <div className="mt-2 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                          <p>Próprio: R$ {formatBRL(p.proprio)}</p>
                          <p>½ compartilhado: R$ {formatBRL(metadeCompartilhado)}</p>
                        </div>
                      )}
                      {modoDivisao === 'igual' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">metade de R$ {formatBRL(estatisticas.totalGeral || 0)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botão Nova Despesa */}
          <div className="mb-8 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.5s forwards'}}>
            <button
              onClick={() => navigate('/nova-despesa')}
              className="bg-emerald-600 dark:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Nova Despesa
            </button>
          </div>

          {/* Últimas Despesas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.6s forwards'}}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Últimas Despesas</h3>
            
            {despesas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhuma despesa cadastrada ainda</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Clique em "Nova Despesa" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {despesas.slice(0, 5).map((despesa) => {
                  const categoria = categorias.find(c => c.id === despesa.categoriaId);
                  return (
                    <div
                      key={despesa.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer select-none"
                      onDoubleClick={() => navigate('/historico')}
                      onTouchEnd={handleDoubleTap}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{categoria?.icone || '📦'}</div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {despesa.descricao || <span className="text-gray-400 dark:text-gray-500 italic">Sem descrição</span>}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {categoria?.nome || 'Sem categoria'} • {new Date(despesa.dataTransacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                          R$ {formatBRL(Number(despesa.valor))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{despesa.metodoPagamento}</p>
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