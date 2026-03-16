import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { despesasApi } from '../api/despesas.api';
import { categoriasApi } from '../api/categorias.api';
import { casalApi } from '../api/casal.api';
import { CurrencyInput } from './CurrencyInput';
import type { Despesa, DespesaRequest, Categoria } from '../types/despesa.types';
import type { CasalData } from '../api/casal.api';

interface ModalEditarDespesaProps {
  despesa: Despesa | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalEditarDespesa = ({ despesa, isOpen, onClose, onSuccess }: ModalEditarDespesaProps) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<DespesaRequest>({
    dataTransacao: '',
    descricao: '',
    valor: 0,
    categoriaId: 0,
    responsavel: 'COMPARTILHADA',
    tipoDespesa: 'VARIAVEL',
    metodoPagamento: 'PIX',
    observacoes: '',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen && despesa) {
      setFormData({
        dataTransacao: despesa.dataTransacao,
        descricao: despesa.descricao,
        valor: Number(despesa.valor),
        categoriaId: despesa.categoriaId,
        responsavel: despesa.responsavel,
        tipoDespesa: despesa.tipoDespesa,
        metodoPagamento: despesa.metodoPagamento,
        observacoes: despesa.observacoes || '',
        urlComprovante: despesa.urlComprovante,
      });
      setComprovantePreview(despesa.urlComprovante || null);
      carregarDados();
    }
  }, [isOpen, despesa]);

  const carregarDados = async () => {
    try {
      const [cats, casalData] = await Promise.all([
        categoriasApi.listarPorCasal(),
        casalApi.buscar(user.casalId),
      ]);
      setCategorias(cats);
      setCasal(casalData);
    } catch {
      toast.error('Erro ao carregar dados');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despesa) return;

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
      await despesasApi.atualizar(despesa.id, formData);
      toast.success('Despesa atualizada!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar despesa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-4 opacity-0" style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Editar Despesa</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Data</label>
              <input
                type="date"
                value={formData.dataTransacao}
                onChange={(e) => setFormData({ ...formData, dataTransacao: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Valor</label>
              <CurrencyInput
                value={formData.valor}
                onChange={(v) => setFormData({ ...formData, valor: v })}
                className="w-full py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
              <div className="relative">
                <select
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({ ...formData, categoriaId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition appearance-none"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icone} {cat.nome}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
              <div className="relative">
                <select
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition appearance-none"
                >
                  <option value="COMPARTILHADA">Compartilhada (50/50)</option>
                  <option value="PARCEIRO_1">{casal?.nomeParceiro1 || 'Parceiro 1'}</option>
                  <option value="PARCEIRO_2">{casal?.nomeParceiro2 || 'Parceiro 2'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <div className="relative">
                <select
                  value={formData.tipoDespesa}
                  onChange={(e) => setFormData({ ...formData, tipoDespesa: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition appearance-none"
                >
                  <option value="VARIAVEL">Variável</option>
                  <option value="FIXA">Fixa</option>
                  <option value="IMPREVISTA">Imprevista</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">▾</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Pagamento</label>
              <div className="relative">
                <select
                  value={formData.metodoPagamento}
                  onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value })}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition appearance-none"
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none transition resize-none"
              rows={2}
            />
          </div>

          {/* Comprovante */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Comprovante</label>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 transition bg-gray-50 dark:bg-gray-700/50 p-3">
              {comprovantePreview ? (
                <div className="w-full">
                  {comprovantePreview.startsWith('data:image') ? (
                    <img src={comprovantePreview} alt="Comprovante" className="max-h-32 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <span className="text-2xl">📄</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">PDF anexado</span>
                    </div>
                  )}
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">Clique para trocar</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-2xl">📎</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Clique para anexar comprovante</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
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
                className="mt-1 text-xs text-red-500 hover:text-red-700 transition"
              >
                Remover comprovante
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:bg-gray-300 transition shadow-lg"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
