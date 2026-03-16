import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { categoriasApi, type SaldoCategoriaData } from '../api/categorias.api';
import { formatBRL } from '../utils/formatBRL';
import { Modal } from '../components/Modal';
import { Sidebar } from '../components/Sidebar';
import { CurrencyInput } from '../components/CurrencyInput';
import type { Categoria } from '../types/despesa.types';

interface CategoriaComSaldo extends Categoria {
  orcamentoMensal: number;
  saldo?: SaldoCategoriaData;
}

export const Categorias = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<CategoriaComSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOrcamento, setModalOrcamento] = useState<CategoriaComSaldo | null>(null);
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<CategoriaComSaldo | null>(null);
  const [modalDesativar, setModalDesativar] = useState<CategoriaComSaldo | null>(null);
  const [novoOrcamento, setNovoOrcamento] = useState(0);
  const [formCategoria, setFormCategoria] = useState({ nome: '', icone: '📦', cor: '#10b981', orcamento: 0 });
  const [submitting, setSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const mes = new Date().getMonth() + 1;
  const ano = new Date().getFullYear();

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const data = await categoriasApi.listarPorCasal();
      const categoriasComSaldo = await Promise.all(
        data.map(async (cat) => {
          try {
            const saldo = await categoriasApi.buscarSaldo(cat.id, mes, ano);
            return { ...cat, orcamentoMensal: cat.orcamentoMensal ?? 0, saldo };
          } catch {
            return { ...cat, orcamentoMensal: cat.orcamentoMensal ?? 0 };
          }
        })
      );
      setCategorias(categoriasComSaldo);
    } catch {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleDefinirOrcamento = async () => {
    if (!modalOrcamento || submitting) return;
    setSubmitting(true);
    try {
      await categoriasApi.definirOrcamento(modalOrcamento.id, novoOrcamento);
      toast.success('Orçamento definido!');
      setModalOrcamento(null);
      setNovoOrcamento(0);
      carregarCategorias();
    } catch {
      toast.error('Erro ao definir orçamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCriar = async () => {
    if (!formCategoria.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      await categoriasApi.criar({
        nome: formCategoria.nome,
        icone: formCategoria.icone,
        cor: formCategoria.cor,
        orcamento: formCategoria.orcamento,
        casalId: user.casalId,
      });
      toast.success('Categoria criada!');
      setModalCriar(false);
      setFormCategoria({ nome: '', icone: '📦', cor: '#10b981', orcamento: 0 });
      carregarCategorias();
    } catch {
      toast.error('Erro ao criar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditar = async () => {
    if (!modalEditar) return;
    if (!formCategoria.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      await categoriasApi.editar(modalEditar.id, {
        nome: formCategoria.nome,
        icone: formCategoria.icone,
        cor: formCategoria.cor,
      });
      toast.success('Categoria atualizada!');
      setModalEditar(null);
      carregarCategorias();
    } catch {
      toast.error('Erro ao editar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDesativar = async () => {
    if (!modalDesativar || submitting) return;
    setSubmitting(true);
    try {
      await categoriasApi.desativar(modalDesativar.id);
      toast.success('Categoria desativada!');
      setModalDesativar(null);
      carregarCategorias();
    } catch {
      toast.error('Erro ao desativar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  const abrirModalEditar = (cat: CategoriaComSaldo) => {
    setFormCategoria({ nome: cat.nome, icone: cat.icone, cor: cat.cor, orcamento: cat.orcamentoMensal ?? 0 });
    setModalEditar(cat);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getStatusColor = (status?: string) => {
    if (status === 'VERMELHO') return 'text-red-600 dark:text-red-400';
    if (status === 'AMARELO') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getBarColor = (status?: string) => {
    if (status === 'VERMELHO') return 'bg-red-500';
    if (status === 'AMARELO') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Categorias</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie categorias e orçamentos mensais</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorias.map((cat, index) => (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-all duration-300 opacity-0"
                  style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s forwards` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{cat.icone}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModalEditar(cat)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setModalDesativar(cat)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-gray-500 dark:text-gray-400"
                        title="Desativar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{cat.nome}</h3>

                  {cat.saldo ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Orçamento:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          R$ {formatBRL(cat.saldo.orcamentoMensal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Gasto:</span>
                        <span className="font-semibold text-red-500 dark:text-red-400">
                          R$ {formatBRL(cat.saldo.totalGasto)}
                        </span>
                      </div>
                      <div className={`flex justify-between text-sm font-bold ${getStatusColor(cat.saldo.status)}`}>
                        <span>Saldo:</span>
                        <span>{cat.saldo.saldo < 0 ? '-' : ''}R$ {formatBRL(Math.abs(cat.saldo.saldo))}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getBarColor(cat.saldo.status)}`}
                          style={{ width: `${Math.min(cat.saldo.percentualGasto, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {cat.saldo.percentualGasto.toFixed(0)}% utilizado
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Sem orçamento definido</p>
                  )}

                  <button
                    onClick={() => {
                      setNovoOrcamento(cat.saldo?.orcamentoMensal ?? cat.orcamentoMensal ?? 0);
                      setModalOrcamento(cat);
                    }}
                    className="mt-4 w-full text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-lg py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                  >
                    💰 Definir Orçamento
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FAB - Nova Categoria */}
      <button
        onClick={() => {
          setFormCategoria({ nome: '', icone: '📦', cor: '#10b981', orcamento: 0 });
          setModalCriar(true);
        }}
        className="fixed bottom-8 right-8 bg-emerald-600 dark:bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-200 hover:scale-110 flex items-center justify-center text-2xl z-10"
        title="Nova Categoria"
      >
        +
      </button>

      {/* Modal Definir Orçamento */}
      {modalOrcamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 opacity-0" style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {modalOrcamento.icone} {modalOrcamento.nome}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Defina o orçamento mensal para esta categoria</p>
            <CurrencyInput
              value={novoOrcamento}
              onChange={setNovoOrcamento}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setModalOrcamento(null); setNovoOrcamento(0); }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDefinirOrcamento}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Categoria */}
      {modalCriar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 opacity-0" style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nova Categoria</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Emoji / Ícone</label>
                <input
                  type="text"
                  value={formCategoria.icone}
                  onChange={(e) => setFormCategoria({ ...formCategoria, icone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none"
                  placeholder="Ex: 🍕"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={formCategoria.nome}
                  onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none"
                  placeholder="Ex: Filha Rafaella"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formCategoria.cor}
                    onChange={(e) => setFormCategoria({ ...formCategoria, cor: e.target.value })}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{formCategoria.cor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Orçamento Mensal (R$)</label>
                <CurrencyInput
                  value={formCategoria.orcamento}
                  onChange={(v) => setFormCategoria({ ...formCategoria, orcamento: v })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalCriar(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {submitting ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Categoria */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 opacity-0" style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Editar Categoria</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Emoji / Ícone</label>
                <input
                  type="text"
                  value={formCategoria.icone}
                  onChange={(e) => setFormCategoria({ ...formCategoria, icone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={formCategoria.nome}
                  onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formCategoria.cor}
                    onChange={(e) => setFormCategoria({ ...formCategoria, cor: e.target.value })}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{formCategoria.cor}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalEditar(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditar}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desativar */}
      <Modal
        isOpen={!!modalDesativar}
        onClose={() => setModalDesativar(null)}
        onConfirm={handleDesativar}
        title="Desativar Categoria?"
        message={`Tem certeza que deseja desativar "${modalDesativar?.nome}"? Ela não aparecerá mais nas despesas.`}
        confirmText="Desativar"
        confirmColor="red"
      />
    </div>
  );
};
