import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/axios';
import { ThemeToggle } from '../components/ThemeToggle';
import type { AuthResponse } from '../types/auth.types';

export const VerificarEmail = () => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reenvioLoading, setReenvioLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const usuarioId = searchParams.get('userId');
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!usuarioId) {
      navigate('/login');
    }
  }, [usuarioId, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) {
      toast.error('Digite os 6 dígitos do código');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/verificar-email', {
        usuarioId: Number(usuarioId),
        codigo,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Email verificado! Bem-vindo ao NossaGrana!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    if (!email || cooldown > 0) return;
    setReenvioLoading(true);
    try {
      await api.post('/auth/reenviar-verificacao', { email });
      toast.success('Novo código enviado para seu email!');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao reenviar código');
    } finally {
      setReenvioLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2 transition-colors">

        {/* Formulário */}
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 text-2xl">
              ✉️
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifique seu email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Enviamos um código de 6 dígitos para{' '}
              {email && <strong className="text-gray-700 dark:text-gray-300">{email}</strong>}
              {!email && 'o seu email'}. Digite abaixo para ativar sua conta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Código de verificação
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition text-center text-3xl font-bold tracking-[0.5em] placeholder-gray-300"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || codigo.length !== 6}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-lg"
            >
              {loading ? 'Verificando...' : 'Verificar email'}
            </button>
          </form>

          {email && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Não recebeu o código?
              </p>
              <button
                onClick={handleReenviar}
                disabled={reenvioLoading || cooldown > 0}
                className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                {cooldown > 0
                  ? `Reenviar em ${cooldown}s`
                  : reenvioLoading
                  ? 'Enviando...'
                  : 'Reenviar código'}
              </button>
            </div>
          )}

          <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Voltar ao login
            </button>
          </p>
        </div>

        {/* Painel direito */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 p-8 md:p-12 flex flex-col justify-center text-white transition-colors">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-3xl">
              🔒
            </div>
            <h2 className="text-2xl font-bold mb-3">Sua conta está quase pronta</h2>
            <p className="text-emerald-100 leading-relaxed">
              A verificação de email garante a segurança da sua conta e evita acessos não autorizados.
            </p>
          </div>
          <div className="space-y-3">
            {['O código expira em 24 horas', 'Verifique também a pasta de Promoções', 'Cada código só pode ser usado uma vez'].map(text => (
              <div key={text} className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
