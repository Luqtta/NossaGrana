import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import { casalApi } from '../api/casal.api';
import type { CasalData } from '../api/casal.api';

export const Configuracoes = () => {
  const navigate = useNavigate();
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConvite, setShowConvite] = useState(false);
  const [showRemoverModal, setShowRemoverModal] = useState(false);
  
  // Form states
  const [emailParceiro, setEmailParceiro] = useState('');
  const [nomeParceiro1, setNomeParceiro1] = useState('');
  const [nomeParceiro2, setNomeParceiro2] = useState('');
  const [metaMensal, setMetaMensal] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    carregarCasal();
  }, []);

  const carregarCasal = async () => {
    try {
      setLoading(true);
      const data = await casalApi.buscar(user.casalId);
      setCasal(data);
      setNomeParceiro1(data.nomeParceiro1 || '');
      setNomeParceiro2(data.nomeParceiro2 || '');
      setMetaMensal(data.metaMensal || 0);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleConvidarParceiro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailParceiro) {
      toast.error('Informe o email do parceiro!');
      return;
    }

    try {
      await casalApi.enviarConvite(emailParceiro);
      toast.success('Convite enviado! O parceiro receberá um email com o link.');
      setShowConvite(false);
      setEmailParceiro('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar convite');
    }
  };

  const handleRemoverParceiro = async () => {
    try {
      await casalApi.removerParceiro(user.casalId);
      toast.success(user.ehParceiro1 ? 'Parceiro removido com sucesso!' : 'Você saiu do casal!');
      
      if (!user.ehParceiro1) {
        // Se for Parceiro 2 saindo, faz logout
        localStorage.clear();
        navigate('/login');
      } else {
        carregarCasal();
      }
    } catch (error) {
      toast.error('Erro ao remover parceiro');
    }
  };

  const handleAtualizarNomes = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await casalApi.atualizarNomes(user.casalId, {
        nomeParceiro1,
        nomeParceiro2,
      });
      toast.success('Nomes atualizados com sucesso!');
      carregarCasal();
    } catch (error) {
      toast.error('Erro ao atualizar nomes');
    }
  };

  const handleAtualizarMeta = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await casalApi.definirMeta(user.casalId, metaMensal);
      toast.success('Meta atualizada com sucesso!');
      carregarCasal();
    } catch (error) {
      toast.error('Erro ao atualizar meta');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 opacity-0 animate-fadeInUp" style={{animation: 'fadeInUp 0.6s ease-out forwards'}}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie seu casal e preferências</p>
          </div>

          {/* Card do Casal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.1s forwards'}}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informações do Casal</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parceiro 1</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {casal?.nomeParceiro1 || 'Não definido'}
                </p>
              </div>
            {casal?.conviteAceito ? (
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parceiro 2</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {casal?.nomeParceiro2 || 'Não definido'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {casal?.emailConviteParceiro2}
                </p>
                {user.ehParceiro1 ? (
                <button
                    onClick={() => setShowRemoverModal(true)}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                    Remover parceiro
                </button>
                ) : (
                <button
                    onClick={() => setShowRemoverModal(true)}
                    className="mt-2 text-sm text-orange-600 dark:text-orange-400 hover:underline"
                >
                    Sair do casal
                </button>
                )}
            </div>
            ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Parceiro 2</p>
                  {!showConvite ? (
                    <button
                      onClick={() => setShowConvite(true)}
                      className="bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
                    >
                      + Convidar Parceiro
                    </button>
                  ) : (
                    <form onSubmit={handleConvidarParceiro} className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        O parceiro receberá um email com um link de convite válido por 48 horas. Ele precisa ter uma conta no NossaGrana.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email do Parceiro
                        </label>
                        <input
                          type="email"
                          value={emailParceiro}
                          onChange={(e) => setEmailParceiro(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                          placeholder="parceiro@email.com"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
                        >
                          Enviar Convite
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConvite(false)}
                          className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Personalizar Nomes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.2s forwards'}}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personalizar Nomes</h3>
            
            <form onSubmit={handleAtualizarNomes} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Parceiro 1
                </label>
                <input
                  type="text"
                  value={nomeParceiro1}
                  onChange={(e) => setNomeParceiro1(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                  placeholder="João"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Parceiro 2
                </label>
                <input
                  type="text"
                  value={nomeParceiro2}
                  onChange={(e) => setNomeParceiro2(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                  placeholder="Maria"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
              >
                Salvar Nomes
              </button>
            </form>
          </div>

          {/* Meta Mensal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-0" style={{animation: 'fadeInUp 0.6s ease-out 0.3s forwards'}}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Meta Mensal de Gastos</h3>
            
            <form onSubmit={handleAtualizarMeta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Meta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={metaMensal}
                  onChange={(e) => setMetaMensal(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
              >
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={showRemoverModal}
        onClose={() => setShowRemoverModal(false)}
        onConfirm={handleRemoverParceiro}
        title={user.ehParceiro1 ? 'Remover Parceiro?' : 'Sair do Casal?'}
        message={
          user.ehParceiro1
            ? 'Tem certeza que deseja remover o parceiro? Esta ação não pode ser desfeita.'
            : 'Tem certeza que deseja sair do casal? Você perderá acesso a todas as despesas compartilhadas.'
        }
        confirmText={user.ehParceiro1 ? 'Remover' : 'Sair'}
        cancelText="Cancelar"
        confirmColor={user.ehParceiro1 ? 'red' : 'orange'}
      />
    </div>
  );
};