import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { despesasApi } from '../api/despesas.api';
import { formatBRL } from '../utils/formatBRL';
import { categoriasApi, type SaldoCategoriaData } from '../api/categorias.api';
import { casalApi } from '../api/casal.api';
import { ThemeToggle } from '../components/ThemeToggle';
import { CurrencyInput } from '../components/CurrencyInput';
import type { Categoria, DespesaRequest } from '../types/despesa.types';
import type { CasalData } from '../api/casal.api';

export const NovaDespesa = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saldoCategoria, setSaldoCategoria] = useState<SaldoCategoriaData | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<DespesaRequest>({
    dataTransacao: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: 0,
    categoriaId: 0,
    responsavel: 'PARCEIRO_1',
    tipoDespesa: 'VARIAVEL',
    metodoPagamento: 'PIX',
    observacoes: '',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (formData.categoriaId) {
      carregarSaldoCategoria();
    }
  }, [formData.categoriaId]);

  const carregarDados = async () => {
    try {
      const [categoriasData, casalData] = await Promise.all([
        categoriasApi.listarPorCasal(),
        casalApi.buscar(user.casalId),
      ]);
      setCategorias(categoriasData);
      setCasal(casalData);
      const responsavelPadrao = casalData?.conviteAceito ? 'COMPARTILHADA' : 'PARCEIRO_1';
      if (categoriasData.length > 0) {
        setFormData(prev => ({ ...prev, categoriaId: categoriasData[0].id, responsavel: responsavelPadrao }));
      } else {
        setFormData(prev => ({ ...prev, responsavel: responsavelPadrao }));
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    }
  };

  const carregarSaldoCategoria = async () => {
    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();
    try {
      const saldo = await categoriasApi.buscarSaldo(formData.categoriaId, mes, ano);
      setSaldoCategoria(saldo);
    } catch {
      console.error('Erro ao carregar saldo');
    }
  };

  const getDescricoesRecentes = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('descricoes_recentes') || '[]');
    } catch {
      return [];
    }
  };

  const salvarDescricaoRecente = (descricao: string) => {
    const recentes = getDescricoesRecentes();
    const atualizado = [descricao, ...recentes.filter(d => d !== descricao)].slice(0, 30);
    localStorage.setItem('descricoes_recentes', JSON.stringify(atualizado));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao.trim()) {
      toast.error('Descrição é obrigatória!');
      return;
    }

    if (formData.valor <= 0) {
      toast.error('Valor deve ser maior que zero!');
      return;
    }

    setLoading(true);

    try {
      await despesasApi.criar(formData);
      salvarDescricaoRecente(formData.descricao.trim());
      toast.success('Despesa cadastrada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar despesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="text-gray-600 dark:text-gray-400" size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Nova Despesa</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registre um novo gasto</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Formulário */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Data da Despesa
              </label>
              <input
                type="date"
                value={formData.dataTransacao}
                onChange={(e) => setFormData({ ...formData, dataTransacao: e.target.value })}
                className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition appearance-none"
                required
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Valor
              </label>
              <CurrencyInput
                value={formData.valor}
                onChange={(v) => setFormData({ ...formData, valor: v })}
                className="w-full py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition"
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <input
              type="text"
              list="descricoes-recentes"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition"
              placeholder="Ex: Supermercado Pão de Açúcar"
              required
            />
            <datalist id="descricoes-recentes">
              {getDescricoesRecentes().map((d, i) => (
                <option key={i} value={d} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Categoria
              </label>
              <div className="relative">
                <select
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({ ...formData, categoriaId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition appearance-none"
                  required
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icone} {cat.nome}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>

              {/* Card de Saldo da Categoria */}
              {saldoCategoria && (
                <div className={`mt-4 p-4 rounded-xl border-2 ${
                  saldoCategoria.status === 'VERDE'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : saldoCategoria.status === 'AMARELO'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{saldoCategoria.icone}</span>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{saldoCategoria.nomeCategoria}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Orçamento do mês</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Orçamento:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">R$ {formatBRL(saldoCategoria.orcamentoMensal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Já gasto:</span>
                      <span className="font-semibold text-red-500 dark:text-red-400">R$ {formatBRL(saldoCategoria.totalGasto)}</span>
                    </div>
                    <div className={`flex justify-between text-sm font-bold ${
                      saldoCategoria.status === 'VERDE' ? 'text-green-600 dark:text-green-400' :
                      saldoCategoria.status === 'AMARELO' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      <span>Saldo:</span>
                      <span>{saldoCategoria.saldo >= 0 ? '+' : ''}R$ {formatBRL(saldoCategoria.saldo)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          saldoCategoria.status === 'VERDE' ? 'bg-green-500' :
                          saldoCategoria.status === 'AMARELO' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(saldoCategoria.percentualGasto, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                      {saldoCategoria.percentualGasto.toFixed(0)}% utilizado
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Responsável
              </label>
              <div className="relative">
                <select
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition appearance-none"
                >
                  <option value="PARCEIRO_1">{casal?.nomeParceiro1 || 'Parceiro 1'}</option>
                  {casal?.conviteAceito && (
                    <option value="PARCEIRO_2">{casal?.nomeParceiro2 || 'Parceiro 2'}</option>
                  )}
                  {casal?.conviteAceito && (
                    <option value="COMPARTILHADA">Compartilhada (50/50)</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Tipo de Despesa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Despesa
              </label>
              <div className="relative">
                <select
                  value={formData.tipoDespesa}
                  onChange={(e) => setFormData({ ...formData, tipoDespesa: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition appearance-none"
                >
                  <option value="VARIAVEL">Variável</option>
                  <option value="FIXA">Fixa</option>
                  <option value="IMPREVISTA">Imprevista</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Método de Pagamento
              </label>
              <div className="relative">
                <select
                  value={formData.metodoPagamento}
                  onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition appearance-none"
                >
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="DEBITO">Débito</option>
                  <option value="CREDITO">Crédito</option>
                  <option value="PIX">PIX</option>
                  <option value="OUTROS">Outros</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition resize-none"
              rows={3}
              placeholder="Informações adicionais..."
            />
          </div>

          {/* Comprovante */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Comprovante (opcional)
            </label>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 transition bg-gray-50 dark:bg-gray-800/50 p-4">
              {comprovantePreview ? (
                <div className="w-full">
                  <img src={comprovantePreview} alt="Comprovante" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Clique para trocar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <span className="text-4xl">📎</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Clique para anexar foto ou PDF do comprovante</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG, PDF até 5MB</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Arquivo muito grande. Máximo 5MB.');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = reader.result as string;
                    setComprovantePreview(base64);
                    setFormData({ ...formData, urlComprovante: base64 });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {comprovantePreview && (
              <button
                type="button"
                onClick={() => { setComprovantePreview(null); setFormData({ ...formData, urlComprovante: undefined }); }}
                className="mt-2 text-xs text-red-500 hover:text-red-700 transition"
              >
                Remover comprovante
              </button>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 dark:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition shadow-lg"
            >
              {loading ? 'Salvando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
