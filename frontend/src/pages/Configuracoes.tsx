import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import { casalApi } from '../api/casal.api';
import { usuarioApi, type UsuarioResponse } from '../api/usuario.api';
import type { CasalData } from '../api/casal.api';

export const Configuracoes = () => {
  const navigate = useNavigate();
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConvite, setShowConvite] = useState(false);
  const [showRemoverModal, setShowRemoverModal] = useState(false);

  const [emailParceiro, setEmailParceiro] = useState('');
  const [userData, setUserData] = useState<any>(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [nomeConta, setNomeConta] = useState(userData.nome || '');
  const [fotoPreview, setFotoPreview] = useState<string | null>(userData.fotoPerfil || null);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  const [novoEmail, setNovoEmail] = useState('');
  const [codigoEmail, setCodigoEmail] = useState('');
  const [codigoEmailEnviado, setCodigoEmailEnviado] = useState(false);
  const [enviandoCodigoEmail, setEnviandoCodigoEmail] = useState(false);
  const [confirmandoEmail, setConfirmandoEmail] = useState(false);

  const [codigoSenha, setCodigoSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigoSenhaEnviado, setCodigoSenhaEnviado] = useState(false);
  const [enviandoCodigoSenha, setEnviandoCodigoSenha] = useState(false);
  const [confirmandoSenha, setConfirmandoSenha] = useState(false);

  useEffect(() => {
    carregarCasal();
  }, []);

  const carregarCasal = async () => {
    try {
      setLoading(true);
      const data = await casalApi.buscar(userData.casalId);
      setCasal(data);
    } catch {
      toast.error('Erro ao carregar configuracoes');
    } finally {
      setLoading(false);
    }
  };

  const atualizarUserLocal = (dados: UsuarioResponse) => {
    const atualizado = { ...userData, ...dados };
    localStorage.setItem('user', JSON.stringify(atualizado));
    setUserData(atualizado);
  };

  const handleConvidarParceiro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailParceiro) {
      toast.error('Informe o email do parceiro');
      return;
    }

    try {
      await casalApi.enviarConvite(emailParceiro);
      toast.success('Convite enviado. O parceiro recebera um email com o link.');
      setShowConvite(false);
      setEmailParceiro('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar convite');
    }
  };

  const handleRemoverParceiro = async () => {
    try {
      await casalApi.removerParceiro(userData.casalId);
      toast.success(userData.ehParceiro1 ? 'Parceiro removido com sucesso' : 'Voce saiu do casal');

      if (!userData.ehParceiro1) {
        localStorage.clear();
        navigate('/login');
      } else {
        carregarCasal();
      }
    } catch {
      toast.error('Erro ao remover parceiro');
    }
  };

  const handleAtualizarNome = async () => {
    const nome = nomeConta.trim();
    if (!nome) {
      toast.error('Informe um nome valido');
      return;
    }

    setSalvandoNome(true);
    try {
      const response = await usuarioApi.atualizarNome(nome);
      atualizarUserLocal(response);
      toast.success('Nome atualizado');
      carregarCasal();
    } catch {
      toast.error('Erro ao atualizar nome');
    } finally {
      setSalvandoNome(false);
    }
  };

  const handleSalvarFoto = async () => {
    setSalvandoFoto(true);
    try {
      const response = await usuarioApi.atualizarFoto(fotoPreview);
      atualizarUserLocal(response);
      toast.success('Foto atualizada');
    } catch {
      toast.error('Erro ao atualizar foto');
    } finally {
      setSalvandoFoto(false);
    }
  };

  const handleEnviarCodigoEmail = async () => {
    if (!novoEmail) {
      toast.error('Informe o novo email');
      return;
    }

    setEnviandoCodigoEmail(true);
    try {
      await usuarioApi.solicitarTrocaEmail(novoEmail);
      setCodigoEmailEnviado(true);
      toast.success('Codigo enviado para o novo email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar codigo');
    } finally {
      setEnviandoCodigoEmail(false);
    }
  };

  const handleConfirmarEmail = async () => {
    if (!codigoEmail) {
      toast.error('Informe o codigo');
      return;
    }

    setConfirmandoEmail(true);
    try {
      const response = await usuarioApi.confirmarTrocaEmail(codigoEmail);
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response));
      setUserData(response);
      setNomeConta(response.nome || '');
      setFotoPreview(response.fotoPerfil || null);
      setNovoEmail('');
      setCodigoEmail('');
      setCodigoEmailEnviado(false);
      toast.success('Email atualizado');
      carregarCasal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao confirmar email');
    } finally {
      setConfirmandoEmail(false);
    }
  };

  const handleEnviarCodigoSenha = async () => {
    setEnviandoCodigoSenha(true);
    try {
      await usuarioApi.solicitarTrocaSenha();
      setCodigoSenhaEnviado(true);
      toast.success('Codigo enviado para o seu email atual');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar codigo');
    } finally {
      setEnviandoCodigoSenha(false);
    }
  };

  const handleConfirmarSenha = async () => {
    if (!codigoSenha) {
      toast.error('Informe o codigo');
      return;
    }
    if (!novaSenha || novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas nao conferem');
      return;
    }

    setConfirmandoSenha(true);
    try {
      await usuarioApi.confirmarTrocaSenha(codigoSenha, novaSenha);
      toast.success('Senha atualizada');
      setCodigoSenha('');
      setNovaSenha('');
      setConfirmarSenha('');
      setCodigoSenhaEnviado(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar senha');
    } finally {
      setConfirmandoSenha(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const nomeAlterado = nomeConta.trim() && nomeConta.trim() !== (userData.nome || '');
  const fotoAlterada = (fotoPreview || null) !== (userData.fotoPerfil || null);

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

  const userInitials = (userData.nome || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8 opacity-0 animate-fadeInUp" style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Configuracoes</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie sua conta e seu casal</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s forwards' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Perfil da conta</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start gap-3">
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Perfil"
                    className="w-24 h-24 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-2xl font-bold border border-emerald-200 dark:border-emerald-800">
                    {userInitials || 'NG'}
                  </div>
                )}
                <label className="w-full text-center md:text-left">
                  <span className="inline-flex items-center justify-center w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer text-sm font-medium">
                    Selecionar foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 3 * 1024 * 1024) {
                        toast.error('Arquivo muito grande. Maximo 3MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setFotoPreview(base64);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={() => setFotoPreview(null)}
                    className="text-xs text-red-500 hover:text-red-700 transition"
                  >
                    Remover foto
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSalvarFoto}
                  disabled={!fotoAlterada || salvandoFoto}
                  className="w-full bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition disabled:opacity-60"
                >
                  {salvandoFoto ? 'Salvando...' : 'Salvar foto'}
                </button>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da conta</label>
                  <input
                    type="text"
                    value={nomeConta}
                    onChange={(e) => setNomeConta(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAtualizarNome}
                  disabled={!nomeAlterado || salvandoNome}
                  className="bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition disabled:opacity-60"
                >
                  {salvandoNome ? 'Salvando...' : 'Salvar nome'}
                </button>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email atual</label>
                  <input
                    type="email"
                    value={userData.email || ''}
                    disabled
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s forwards' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Email e senha</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Novo email</label>
                  <input
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                    placeholder="novo@email.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleEnviarCodigoEmail}
                  disabled={enviandoCodigoEmail}
                  className="w-full border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                >
                  {enviandoCodigoEmail ? 'Enviando...' : 'Enviar codigo para o novo email'}
                </button>

                {codigoEmailEnviado && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={codigoEmail}
                      onChange={(e) => setCodigoEmail(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                      placeholder="Codigo recebido"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmarEmail}
                      disabled={confirmandoEmail}
                      className="w-full bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
                    >
                      {confirmandoEmail ? 'Confirmando...' : 'Confirmar troca de email'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Codigo enviado para o email atual: <span className="font-semibold">{userData.email}</span></p>
                <button
                  type="button"
                  onClick={handleEnviarCodigoSenha}
                  disabled={enviandoCodigoSenha}
                  className="w-full border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                >
                  {enviandoCodigoSenha ? 'Enviando...' : 'Enviar codigo para trocar senha'}
                </button>

                {codigoSenhaEnviado && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={codigoSenha}
                      onChange={(e) => setCodigoSenha(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                      placeholder="Codigo recebido"
                    />
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                      placeholder="Nova senha"
                    />
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                      placeholder="Confirmar nova senha"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmarSenha}
                      disabled={confirmandoSenha}
                      className="w-full bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
                    >
                      {confirmandoSenha ? 'Confirmando...' : 'Confirmar troca de senha'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 opacity-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s forwards' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informacoes do casal</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parceiro 1</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {casal?.nomeParceiro1 || 'Nao definido'}
                </p>
              </div>

              {casal?.conviteAceito ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Parceiro 2</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {casal?.nomeParceiro2 || 'Nao definido'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {casal?.emailConviteParceiro2}
                  </p>
                  {userData.ehParceiro1 ? (
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
                      + Convidar parceiro
                    </button>
                  ) : (
                    <form onSubmit={handleConvidarParceiro} className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        O parceiro recebera um email com um link de convite valido por 48 horas. Ele precisa ter uma conta no NossaGrana.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email do parceiro
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
                          Enviar convite
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
        </div>
      </main>

      <Modal
        isOpen={showRemoverModal}
        onClose={() => setShowRemoverModal(false)}
        onConfirm={handleRemoverParceiro}
        title={userData.ehParceiro1 ? 'Remover parceiro?' : 'Sair do casal?'}
        message={
          userData.ehParceiro1
            ? 'Tem certeza que deseja remover o parceiro? Esta acao nao pode ser desfeita.'
            : 'Tem certeza que deseja sair do casal? Voce perdera acesso a todas as despesas compartilhadas.'
        }
        confirmText={userData.ehParceiro1 ? 'Remover' : 'Sair'}
        cancelText="Cancelar"
        confirmColor={userData.ehParceiro1 ? 'red' : 'orange'}
      />
    </div>
  );
};
