import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { Palette, Image as ImageIcon, GripVertical, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';
import { preferenciasApi, CARDS_DISPONIVEIS, type CardId } from '../api/preferencias.api';
import { fazerLogout } from '../utils/logout';

const CORES_PADRAO = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#ef4444', '#14b8a6', '#6366f1',
];

export const Personalizar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [cor, setCor] = useState('#10b981');
  const [opacidade, setOpacidade] = useState(20);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const [imagemMime, setImagemMime] = useState<string>('');
  const [removerImagem, setRemoverImagem] = useState(false);
  const [ordemCards, setOrdemCards] = useState<CardId[]>(CARDS_DISPONIVEIS.map(c => c.id));
  const [cardsEscondidos, setCardsEscondidos] = useState<Set<CardId>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      setLoading(true);
      const pref = await preferenciasApi.buscar();
      if (pref.corDestaque) setCor(pref.corDestaque);
      if (typeof pref.opacidadeFundo === 'number') setOpacidade(pref.opacidadeFundo);

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
          const arr = JSON.parse(pref.cardsEscondidos) as CardId[];
          setCardsEscondidos(new Set(arr));
        } catch {}
      }

      if (pref.temImagemFundo) {
        const url = await preferenciasApi.imagemFundoBlobUrl();
        if (url) setImagemPreview(url);
      }
    } catch {
      toast.error('Erro ao carregar preferências');
    } finally {
      setLoading(false);
    }
  };

  const handleImagemSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máximo 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagemPreview(base64);
      setImagemBase64(base64);
      setImagemMime(file.type || 'image/jpeg');
      setRemoverImagem(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverImagem = () => {
    if (imagemPreview && imagemPreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagemPreview);
    }
    setImagemPreview(null);
    setImagemBase64(null);
    setRemoverImagem(true);
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      await preferenciasApi.atualizar({
        corDestaque: cor,
        opacidadeFundo: opacidade,
        ordemCards: JSON.stringify(ordemCards),
        cardsEscondidos: JSON.stringify(Array.from(cardsEscondidos)),
        imagemFundoBase64: imagemBase64 || undefined,
        imagemFundoMime: imagemMime || undefined,
        removerImagemFundo: removerImagem,
      });
      toast.success('Preferências salvas!');
      navigate('/dashboard');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleRestaurar = () => {
    setCor('#10b981');
    setOpacidade(20);
    setOrdemCards(CARDS_DISPONIVEIS.map(c => c.id));
    setCardsEscondidos(new Set());
    handleRemoverImagem();
  };

  const toggleCard = (id: CardId) => {
    setCardsEscondidos(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const moverCard = (de: number, para: number) => {
    if (de === para) return;
    setOrdemCards(prev => {
      const novo = [...prev];
      const [item] = novo.splice(de, 1);
      novo.splice(para, 0, item);
      return novo;
    });
  };

  const handleLogout = () => fazerLogout(navigate);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Palette className="text-emerald-500" /> Personalizar Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Deixe o seu dashboard do seu jeito
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRestaurar}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <RotateCcw size={16} /> Restaurar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="bg-emerald-600 dark:bg-emerald-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-lg flex items-center gap-2 disabled:opacity-60"
              >
                <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Cor de destaque */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Cor de destaque</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {CORES_PADRAO.map(c => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  className={`w-10 h-10 rounded-full border-4 transition ${cor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="flex items-center gap-2 ml-2 cursor-pointer">
                <span
                  className="relative w-10 h-10 rounded-full border-4 border-transparent shadow-inner overflow-hidden block"
                  style={{ backgroundColor: cor }}
                >
                  <input
                    type="color"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Escolher cor personalizada"
                  />
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Personalizada</span>
              </label>
            </div>
          </div>

          {/* Imagem de fundo */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ImageIcon size={20} /> Imagem de fundo
            </h3>
            {imagemPreview ? (
              <div className="space-y-3">
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${imagemPreview})` }}
                  />
                  <div
                    className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                    style={{ opacity: 1 - opacidade / 100 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3 text-white drop-shadow-lg">
                    <div className="w-12 h-12 rounded-full border-[3px] border-white shadow-md flex items-center justify-center text-white font-bold" style={{ backgroundColor: cor }}>
                      P
                    </div>
                    <div>
                      <p className="font-bold leading-tight">Preview do banner</p>
                      <p className="text-xs text-white/85">Finanças · opacidade {opacidade}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400 w-32 shrink-0">Opacidade: {opacidade}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacidade}
                    onChange={(e) => setOpacidade(parseInt(e.target.value))}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
                    Trocar imagem
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImagemSelect(f); }} />
                  </label>
                  <button
                    onClick={handleRemoverImagem}
                    className="px-4 py-2 border-2 border-red-300 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 transition p-8">
                <ImageIcon size={36} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Clique para escolher uma imagem</span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG até 5MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImagemSelect(f); }} />
              </label>
            )}
          </div>

          {/* Ordem e visibilidade dos cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Cards do dashboard</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Arraste para reordenar. Use o olho pra mostrar/esconder.
            </p>
            <div className="space-y-2">
              {ordemCards.map((id, index) => {
                const card = CARDS_DISPONIVEIS.find(c => c.id === id);
                if (!card) return null;
                const escondido = cardsEscondidos.has(id);
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragIndex !== null) moverCard(dragIndex, index); setDragIndex(null); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-move ${
                      escondido ? 'bg-gray-50 dark:bg-gray-700/50 border-dashed border-gray-300 dark:border-gray-600 opacity-60' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <GripVertical size={18} className="text-gray-400" />
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                      {card.label}
                    </span>
                    <button
                      onClick={() => toggleCard(id)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                      title={escondido ? 'Mostrar' : 'Esconder'}
                    >
                      {escondido ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-emerald-500" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
