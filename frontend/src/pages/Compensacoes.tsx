import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { SkeletonCard } from '../components/SkeletonCard';
import { CurrencyInput } from '../components/CurrencyInput';
import { compensacoesApi } from '../api/compensacoes.api';
import type { Compensacao, CompensacaoRequest, MembroCasal, TipoCompensacao } from '../types/compensacao.types';
import { TIPOS_COMPENSACAO } from '../types/compensacao.types';
import { formatBRL } from '../utils/formatBRL';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const tipoLabel = (tipo: TipoCompensacao) => TIPOS_COMPENSACAO[tipo] ?? tipo;

const tipoColor: Record<TipoCompensacao, string> = {
  EMPRESTIMO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ADIANTAMENTO_PENSAO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  OUTROS: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

interface ModalState {
  open: boolean;
  editando: Compensacao | null;
}

interface FormData {
  tipo: TipoCompensacao;
  descricao: string;
  valor: number;
  dataReferencia: string;
  usuarioOrigemId: number | '';
  usuarioDestinoId: number | '';
}

const formInicial = (mes: number, ano: number): FormData => ({
  tipo: 'EMPRESTIMO',
  descricao: '',
  valor: 0,
  dataReferencia: `${ano}-${String(mes).padStart(2, '0')}-01`,
  usuarioOrigemId: '',
  usuarioDestinoId: '',
});

export const Compensacoes = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const [compensacoes, setCompensacoes] = useState<Compensacao[]>([]);
  const [membros, setMembros] = useState<MembroCasal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, editando: null });
  const [form, setForm] = useState<FormData>(formInicial(mes, ano));
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    carregarMembros();
  }, []);

  useEffect(() => {
    carregarCompensacoes();
  }, [mes, ano]);

  const carregarMembros = async () => {
    try {
      const data = await compensacoesApi.buscarMembros();
      setMembros(data);
    } catch {
      toast.error('Erro ao carregar membros do casal');
    }
  };

  const carregarCompensacoes = async () => {
    try {
      setLoading(true);
      const data = await compensacoesApi.listarPorMes(mes, ano);
      setCompensacoes(data);
    } catch {
      toast.error('Erro ao carregar compensações');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNovo = () => {
    setForm(formInicial(mes, ano));
    setModal({ open: true, editando: null });
  };

  const abrirModalEditar = (c: Compensacao) => {
    setForm({
      tipo: c.tipo,
      descricao: c.descricao ?? '',
      valor: Number(c.valor),
      dataReferencia: c.dataReferencia,
      usuarioOrigemId: c.usuarioOrigemId,
      usuarioDestinoId: c.usuarioDestinoId,
    });
    setModal({ open: true, editando: c });
  };

  const fecharModal = () => {
    setModal({ open: false, editando: null });
    setForm(formInicial(mes, ano));
  };

  const handleSalvar = async () => {
    if (!form.usuarioOrigemId || !form.usuarioDestinoId) {
      toast.error('Selecione origem e destino');
      return;
    }
    if (form.usuarioOrigemId === form.usuarioDestinoId) {
      toast.error('Origem e destino não podem ser a mesma pessoa');
      return;
    }
    if (!form.valor || form.valor <= 0) {
      toast.error('Informe um valor maior que zero');
      return;
    }

    setSalvando(true);
    try {
      const payload: CompensacaoRequest = {
        tipo: form.tipo,
        descricao: form.descricao || undefined,
        valor: form.valor,
        dataReferencia: form.dataReferencia,
        usuarioOrigemId: form.usuarioOrigemId as number,
        usuarioDestinoId: form.usuarioDestinoId as number,
      };

      if (modal.editando) {
        await compensacoesApi.atualizar(modal.editando.id, payload);
        toast.success('Compensação atualizada!');
      } else {
        await compensacoesApi.criar(payload);
        toast.success('Compensação registrada!');
      }

      fecharModal();
      carregarCompensacoes();
    } catch {
      toast.error('Erro ao salvar compensação');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await compensacoesApi.inativar(id);
      toast.success('Compensação removida!');
      setConfirmDelete(null);
      carregarCompensacoes();
    } catch {
      toast.error('Erro ao remover compensação');
    }
  };

  const totalMes = compensacoes.reduce((acc, c) => acc + Number(c.valor), 0);

  const anoOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div
            className="mb-8 opacity-0"
            style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Compensações</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Empréstimos e ajustes financeiros entre parceiros
                </p>
              </div>
              <button
                onClick={abrirModalNovo}
                className="flex items-center gap-2 bg-emerald-600 dark:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-lg"
              >
                <Plus size={18} />
                Nova Compensação
              </button>
            </div>
          </div>

          {/* Filtro de período */}
          <div
            className="flex gap-3 mb-6 opacity-0"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.1s forwards' }}
          >
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MESES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={ano}
              onChange={e => setAno(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {anoOptions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Resumo do mês */}
          {!loading && compensacoes.length > 0 && (
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-6 opacity-0"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.15s forwards' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-emerald-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {compensacoes.length} compensaç{compensacoes.length === 1 ? 'ão' : 'ões'} em {MESES[mes - 1]}/{ano}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Total: R$ {formatBRL(totalMes)}
                </span>
              </div>
            </div>
          )}

          {/* Lista */}
          <div
            className="opacity-0"
            style={{ animation: 'fadeInUp 0.6s ease-out 0.2s forwards' }}
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : compensacoes.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
                <ArrowRightLeft size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  Nenhuma compensação em {MESES[mes - 1]}/{ano}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  Registre empréstimos ou ajustes entre vocês
                </p>
                <button
                  onClick={abrirModalNovo}
                  className="mt-6 inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition"
                >
                  <Plus size={16} />
                  Nova Compensação
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {compensacoes.map(c => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <ArrowRightLeft size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tipoColor[c.tipo]}`}>
                            {tipoLabel(c.tipo)}
                          </span>
                          {c.descricao && (
                            <span className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">
                              {c.descricao}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium text-sky-600 dark:text-sky-400">{c.nomeOrigem}</span>
                          {' → '}
                          <span className="font-medium text-violet-600 dark:text-violet-400">{c.nomeDestino}</span>
                          {' · '}
                          {new Date(c.dataReferencia + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        R$ {formatBRL(Number(c.valor))}
                      </p>
                      <button
                        onClick={() => abrirModalEditar(c)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal criar/editar */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {modal.editando ? 'Editar Compensação' : 'Nova Compensação'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoCompensacao }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(TIPOS_COMPENSACAO).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Empréstimo para emergência"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor
                </label>
                <CurrencyInput
                  value={form.valor}
                  onChange={val => setForm(f => ({ ...f, valor: val }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Data de referência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de referência
                </label>
                <input
                  type="date"
                  value={form.dataReferencia}
                  onChange={e => setForm(f => ({ ...f, dataReferencia: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Origem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quem concedeu / pagou
                </label>
                <select
                  value={form.usuarioOrigemId}
                  onChange={e => setForm(f => ({ ...f, usuarioOrigemId: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {membros.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>

              {/* Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quem recebeu
                </label>
                <select
                  value={form.usuarioDestinoId}
                  onChange={e => setForm(f => ({ ...f, usuarioDestinoId: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {membros
                    .filter(m => m.id !== form.usuarioOrigemId)
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={fecharModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : modal.editando ? 'Atualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Remover compensação?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Esta ação não pode ser desfeita. A compensação será removida do cálculo do mês.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExcluir(confirmDelete)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
