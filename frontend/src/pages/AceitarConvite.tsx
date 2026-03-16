import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/axios';

interface ConviteInfo {
  nomeParceiro1: string;
  emailConvidado: string;
  casalId: number;
  expirado: boolean;
  usado: boolean;
}

export const AceitarConvite = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const [convite, setConvite] = useState<ConviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [aceitando, setAceitando] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!user.id;

  useEffect(() => {
    if (!codigo) return;
    api.get(`/convites/${codigo}`)
      .then((res) => setConvite(res.data))
      .catch(() => toast.error('Convite não encontrado ou inválido'))
      .finally(() => setLoading(false));
  }, [codigo]);

  const handleAceitar = async () => {
    if (!isLoggedIn) {
      localStorage.setItem('convite_pendente', codigo!);
      navigate(`/login?convite=${codigo}`);
      return;
    }

    setAceitando(true);
    try {
      const response = await api.post(
        `/convites/${codigo}/aceitar`,
        {},
        { headers: { 'X-User-Id': user.id } }
      );

      // Update stored user data with new casal info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data));

      toast.success('Bem-vindo ao casal! Suas despesas anteriores foram removidas.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao aceitar convite');
    } finally {
      setAceitando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!convite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Convite inválido</h2>
          <p className="text-gray-600 dark:text-gray-400">Este link de convite não existe ou foi removido.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  if (convite.expirado || convite.usado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {convite.usado ? 'Convite já utilizado' : 'Convite expirado'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {convite.usado
              ? 'Este convite já foi aceito anteriormente.'
              : 'Este convite expirou após 48 horas. Peça um novo convite ao seu parceiro.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Convite para o NossaGrana</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            <strong className="text-gray-900 dark:text-white">{convite.nomeParceiro1}</strong> te convidou para gerenciar as finanças juntos.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400 mb-1">Atenção antes de aceitar</h3>
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                Ao aceitar este convite, <strong>todas as despesas que você registrou sozinho serão excluídas permanentemente</strong>.
                A partir daí, você passará a compartilhar as finanças com {convite.nomeParceiro1}.
              </p>
            </div>
          </div>
        </div>

        {/* User check */}
        {isLoggedIn ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-6 text-sm text-center text-gray-600 dark:text-gray-400">
            Aceitando como <strong className="text-gray-900 dark:text-white">{user.email}</strong>
            {user.email?.toLowerCase() !== convite.emailConvidado?.toLowerCase() && (
              <p className="text-red-600 dark:text-red-400 mt-1 font-semibold">
                Este convite é para {convite.emailConvidado}. Faça login com o email correto.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-6 text-sm text-center text-blue-700 dark:text-blue-400">
            Você precisa estar logado para aceitar o convite.
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isLoggedIn && user.email?.toLowerCase() === convite.emailConvidado?.toLowerCase() ? (
            <button
              onClick={handleAceitar}
              disabled={aceitando}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {aceitando ? 'Aceitando...' : 'Aceitar e entrar no casal'}
            </button>
          ) : !isLoggedIn ? (
            <button
              onClick={handleAceitar}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition shadow-lg"
            >
              Fazer login para aceitar
            </button>
          ) : null}

          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
};
