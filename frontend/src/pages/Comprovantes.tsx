import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import { FolderArchive, Upload, Trash2, FileText, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { comprovantesApi, type Comprovante } from '../api/comprovantes.api';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const Comprovantes = () => {
  const navigate = useNavigate();
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('');
  const [pastasAbertas, setPastasAbertas] = useState<Set<string>>(new Set());
  const [confirmarDelete, setConfirmarDelete] = useState<Comprovante | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      setLoading(true);
      const data = await comprovantesApi.listar();
      setComprovantes(data);
      const chaveAtual = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      setPastasAbertas(new Set([chaveAtual]));
    } catch {
      toast.error('Erro ao carregar comprovantes');
    } finally {
      setLoading(false);
    }
  };

  const agrupados = useMemo(() => {
    const grupos = new Map<string, Comprovante[]>();
    for (const c of comprovantes) {
      const chave = `${c.ano}-${c.mes}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(c);
    }
    return Array.from(grupos.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [comprovantes]);

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }
    try {
      setUploading(true);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const hoje = new Date();
      await comprovantesApi.upload({
        nome: file.name,
        mimeType: file.type || 'application/octet-stream',
        dadosBase64: base64,
        mes: hoje.getMonth() + 1,
        ano: hoje.getFullYear(),
      });
      toast.success('Comprovante adicionado!');
      await carregar();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  const abrirPreview = async (c: Comprovante) => {
    try {
      const url = await comprovantesApi.baixarBlob(c.id);
      setPreviewUrl(url);
      setPreviewMime(c.mimeType);
    } catch {
      toast.error('Erro ao abrir comprovante');
    }
  };

  const fecharPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewMime('');
  };

  const togglePasta = (chave: string) => {
    setPastasAbertas(prev => {
      const novo = new Set(prev);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  };

  const handleDelete = async () => {
    if (!confirmarDelete) return;
    try {
      await comprovantesApi.deletar(confirmarDelete.id);
      toast.success('Comprovante removido');
      setConfirmarDelete(null);
      await carregar();
    } catch {
      toast.error('Erro ao deletar');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FolderArchive className="text-emerald-500" /> Comprovantes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Todos os comprovantes do casal, organizados por mês
              </p>
            </div>

            <label className="bg-emerald-600 dark:bg-emerald-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-lg flex items-center gap-2 cursor-pointer">
              <Upload size={18} />
              {uploading ? 'Enviando...' : 'Adicionar comprovante'}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : agrupados.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FolderArchive size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum comprovante ainda</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Anexe comprovantes nas despesas ou use o botão acima
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agrupados.map(([chave, lista]) => {
                const [ano, mes] = chave.split('-').map(Number);
                const aberto = pastasAbertas.has(chave);
                return (
                  <div key={chave} className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => togglePasta(chave)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        {aberto ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <FolderArchive className="text-amber-500" size={22} />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {MESES[mes - 1]} / {ano}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {lista.length} {lista.length === 1 ? 'arquivo' : 'arquivos'}
                      </span>
                    </button>

                    {aberto && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700 border-t border-gray-100 dark:border-gray-700">
                        {lista.map(c => (
                          <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                            <button
                              onClick={() => abrirPreview(c)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              {c.mimeType.startsWith('image/') ? (
                                <ImageIcon size={20} className="text-blue-500 flex-shrink-0" />
                              ) : (
                                <FileText size={20} className="text-red-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {c.nome}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {c.descricaoDespesa ? `Despesa: ${c.descricaoDespesa}` : 'Avulso'}
                                  {c.usuarioNome && ` • ${c.usuarioNome}`}
                                </p>
                              </div>
                            </button>
                            <button
                              onClick={() => setConfirmarDelete(c)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={fecharPreview}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl max-h-[90vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
            {previewMime.startsWith('image/') ? (
              <img src={previewUrl} alt="Comprovante" className="max-w-full max-h-[80vh] mx-auto" />
            ) : (
              <iframe src={previewUrl} className="w-[80vw] h-[80vh]" title="Comprovante" />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <a href={previewUrl} download className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                Baixar
              </a>
              <button onClick={fecharPreview} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!confirmarDelete}
        onClose={() => setConfirmarDelete(null)}
        title="Deletar comprovante"
        message={`Tem certeza que deseja deletar "${confirmarDelete?.nome}"?`}
        confirmText="Deletar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        confirmColor="red"
      />
    </div>
  );
};
