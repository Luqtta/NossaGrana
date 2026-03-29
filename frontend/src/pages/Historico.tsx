import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { despesasApi, type FiltrosDespesas } from '../api/despesas.api';
import { formatBRL } from '../utils/formatBRL';
import { categoriasApi } from '../api/categorias.api';
import { casalApi } from '../api/casal.api';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import { ModalEditarDespesa } from '../components/ModalEditarDespesa';
import { AnimatedNumber } from '../components/AnimatedNumber';
import type { Despesa, Categoria } from '../types/despesa.types';
import type { CasalData } from '../api/casal.api';

const SkeletonRow = () => (
  <div className="flex items-center justify-between p-6 animate-pulse">
    <div className="flex items-center gap-4 flex-1">
      <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
      </div>
    </div>
    <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
  </div>
);

export const Historico = () => {
  const navigate = useNavigate();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesAno, setMesAno] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  const [despesaEditando, setDespesaEditando] = useState<Despesa | null>(null);
  const [despesaDeletando, setDespesaDeletando] = useState<Despesa | null>(null);
  const [despesaCancelando, setDespesaCancelando] = useState<Despesa | null>(null);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosDespesas>({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
  });

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    carregarDados();
  }, [mesAno]);

  // Auto-filtro com debounce
  useEffect(() => {
    if (!mostrarFiltros) return;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const resultado = await despesasApi.filtrar(user.casalId, filtros);
        setDespesas(resultado);
        setPaginaAtual(1);
      } catch {
        toast.error('Erro ao filtrar');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [filtros, mostrarFiltros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [ano, mes] = mesAno.split('-').map(Number);
      const [data, cats, casalData] = await Promise.all([
        despesasApi.listarPorMes(mes, ano),
        categoriasApi.listarPorCasal(),
        casalApi.buscar(user.casalId),
      ]);
      setDespesas(data);
      setCategorias(cats);
      setCasal(casalData);
      setPaginaAtual(1);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };


  const limparFiltros = () => {
    setFiltros({
      dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0],
    });
    carregarDados();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getCategoriaIcone = (categoriaId: number) => {
    return categorias.find(c => c.id === categoriaId)?.icone || '📦';
  };

  const exportarCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Responsável', 'Tipo', 'Método', 'Valor'];
    const rows = despesas.map(d => [
      new Date(d.dataTransacao + 'T00:00:00').toLocaleDateString('pt-BR'),
      `"${d.descricao.replace(/"/g, '""')}"`,
      d.categoriaNome,
      getResponsavelNome(d.responsavel),
      d.tipoDespesa || '',
      d.metodoPagamento || '',
      formatBRL(Number(d.valor)),
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `despesas_${mesAno}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const getResponsavelNome = (responsavel: string) => {
    if (responsavel === 'PARCEIRO_1') return casal?.nomeParceiro1 || 'Parceiro 1';
    if (responsavel === 'PARCEIRO_2') return casal?.nomeParceiro2 || 'Parceiro 2';
    return 'Compartilhada';
  };

  const abrirComprovante = (urlComprovante: string) => {
    try {
      const [meta, base64] = urlComprovante.split(',');
      const mimeType = meta.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const byteChars = atob(base64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArray], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch {
      toast.error('Não foi possível abrir o comprovante');
    }
  };

  const totalGasto = despesas.reduce((acc, d) => acc + Number(d.valor), 0);
  const despesasPorTipo = {
    FIXA: despesas.filter(d => d.tipoDespesa === 'FIXA').reduce((acc, d) => acc + Number(d.valor), 0),
    VARIAVEL: despesas.filter(d => d.tipoDespesa === 'VARIAVEL').reduce((acc, d) => acc + Number(d.valor), 0),
    IMPREVISTA: despesas.filter(d => d.tipoDespesa === 'IMPREVISTA').reduce((acc, d) => acc + Number(d.valor), 0),
  };

  const despesasPaginadas = despesas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );
  const totalPaginas = Math.ceil(despesas.length / itensPorPagina);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between opacity-0 animate-fadeInUp" style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Histórico de Despesas</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Visualize todas as suas despesas por mês</p>
            </div>
            {despesas.length > 0 && (
              <button
                onClick={exportarCSV}
                className="bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition font-medium text-sm"
              >
                📥 Exportar CSV
              </button>
            )}
          </div>

          {/* Seletor de Mês */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s forwards' }}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Selecione o Mês
            </label>
            <input
              type="month"
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition"
            />
          </div>

          {/* Cards Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[
              { label: 'Total', value: totalGasto, color: 'text-gray-900 dark:text-white', delay: '0.2s' },
              { label: 'Fixas', value: despesasPorTipo.FIXA, color: 'text-blue-600 dark:text-blue-400', delay: '0.3s' },
              { label: 'Variáveis', value: despesasPorTipo.VARIAVEL, color: 'text-emerald-600 dark:text-emerald-400', delay: '0.4s' },
              { label: 'Imprevistas', value: despesasPorTipo.IMPREVISTA, color: 'text-red-600 dark:text-red-400', delay: '0.5s' },
            ].map((card) => (
              <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 opacity-0" style={{ animation: `fadeInUp 0.6s ease-out ${card.delay} forwards` }}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  <AnimatedNumber value={card.value} />
                </p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.55s forwards' }}>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium"
            >
              🔍 Filtros {mostrarFiltros ? '▲' : '▼'}
            </button>

            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                  <div className="relative">
                    <select
                      value={filtros.categoriaId || ''}
                      onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 pr-8 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg focus:border-emerald-500 outline-none appearance-none"
                    >
                      <option value="">Todas</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icone} {cat.nome}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-400">▾</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                  <div className="relative">
                    <select
                      value={filtros.responsavel || ''}
                      onChange={(e) => setFiltros({ ...filtros, responsavel: e.target.value || undefined })}
                      className="w-full px-3 py-2 pr-8 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg focus:border-emerald-500 outline-none appearance-none"
                    >
                      <option value="">Todos</option>
                      <option value="PARCEIRO_1">{casal?.nomeParceiro1 || 'Parceiro 1'}</option>
                      {casal?.conviteAceito && (
                        <option value="PARCEIRO_2">{casal?.nomeParceiro2 || 'Parceiro 2'}</option>
                      )}
                      {casal?.conviteAceito && (
                        <option value="COMPARTILHADA">Compartilhada</option>
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-400">▾</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <div className="relative">
                    <select
                      value={filtros.tipoDespesa || ''}
                      onChange={(e) => setFiltros({ ...filtros, tipoDespesa: e.target.value || undefined })}
                      className="w-full px-3 py-2 pr-8 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg focus:border-emerald-500 outline-none appearance-none"
                    >
                      <option value="">Todos</option>
                      <option value="FIXA">Fixa</option>
                      <option value="VARIAVEL">Variável</option>
                      <option value="IMPREVISTA">Imprevista</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-400">▾</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
                  <input
                    type="text"
                    placeholder="Descrição..."
                    value={filtros.descricao || ''}
                    onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value || undefined })}
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Período</label>
                  <div className="space-y-1">
                    <input
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg focus:border-emerald-500 outline-none text-sm"
                    />
                    <input
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg focus:border-emerald-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-3 lg:col-span-5 flex gap-2 justify-end">
                  <button
                    onClick={limparFiltros}
                    className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Despesas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s forwards' }}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {despesas.length} despesas
              </h3>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
              </div>
            ) : despesas.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma despesa encontrada</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {despesasPaginadas.map((despesa, index) => (
                    <div
                      key={despesa.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition opacity-0"
                      style={{ animation: `fadeInUp 0.4s ease-out ${0.7 + (index * 0.04)}s forwards` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getCategoriaIcone(despesa.categoriaId)}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{despesa.descricao}</h4>
                                {despesa.editada && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded">Editada</span>
                                )}
                                {despesa.recorrente && despesa.recorrenciaAtiva && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
                                    🔁 Recorrente
                                  </span>
                                )}
                                {despesa.recorrente && !despesa.recorrenciaAtiva && (
                                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
                                    ⏹ Cancelada
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{despesa.categoriaNome}</p>
                              {despesa.observacoes && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{despesa.observacoes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            <span>📅 {new Date(despesa.dataTransacao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                            <span>👤 {getResponsavelNome(despesa.responsavel)}</span>
                            <span className={`px-2 py-0.5 rounded ${
                              despesa.tipoDespesa === 'FIXA' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              despesa.tipoDespesa === 'IMPREVISTA' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            }`}>
                              {despesa.tipoDespesa}
                            </span>
                            {despesa.metodoPagamento && <span>💳 {despesa.metodoPagamento}</span>}
                            {despesa.urlComprovante && (
                              <button
                                onClick={() => abrirComprovante(despesa.urlComprovante!)}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                📎 Comprovante
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            R$ {formatBRL(Number(despesa.valor))}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{despesa.usuarioNome}</p>
                          <div className="flex gap-2 justify-end flex-wrap">
                            {despesa.recorrente && despesa.recorrenciaAtiva && (
                              <button
                                onClick={() => setDespesaCancelando(despesa)}
                                className="text-xs text-orange-600 dark:text-orange-400 px-2 py-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                              >
                                ⏹ Cancelar recorrência
                              </button>
                            )}
                            <button
                              onClick={() => setDespesaEditando(despesa)}
                              className="text-xs text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => setDespesaDeletando(despesa)}
                              className="text-xs text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                              🗑️ Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPaginas > 1 && (
                  <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      ← Anterior
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                      Página {paginaAtual} de {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Próxima →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <ModalEditarDespesa
        despesa={despesaEditando}
        isOpen={!!despesaEditando}
        onClose={() => setDespesaEditando(null)}
        onSuccess={() => {
          setDespesaEditando(null);
          carregarDados();
        }}
      />

      <Modal
        isOpen={!!despesaDeletando}
        onClose={() => setDespesaDeletando(null)}
        onConfirm={async () => {
          if (!despesaDeletando) return;
          try {
            await despesasApi.deletar(despesaDeletando.id);
            toast.success('Despesa deletada!');
            setDespesaDeletando(null);
            carregarDados();
          } catch {
            toast.error('Erro ao deletar despesa');
          }
        }}
        title="Deletar Despesa?"
        message={`Tem certeza que deseja deletar "${despesaDeletando?.descricao}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        confirmColor="red"
      />

      <Modal
        isOpen={!!despesaCancelando}
        onClose={() => setDespesaCancelando(null)}
        onConfirm={async () => {
          if (!despesaCancelando) return;
          try {
            await despesasApi.cancelarRecorrencia(despesaCancelando.id);
            toast.success('Recorrência cancelada! As despesas já geradas foram mantidas no histórico.');
            setDespesaCancelando(null);
            carregarDados();
          } catch {
            toast.error('Erro ao cancelar recorrência');
          }
        }}
        title="Cancelar Recorrência?"
        message={`A despesa "${despesaCancelando?.descricao}" deixará de ser gerada automaticamente a partir do próximo mês. As ocorrências já registradas serão mantidas no histórico.`}
        confirmText="Cancelar recorrência"
        confirmColor="orange"
      />
    </div>
  );
};
