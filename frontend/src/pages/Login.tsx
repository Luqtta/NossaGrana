import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/axios';
import { PasswordInput } from '../components/PasswordInput';
import { ThemeToggle } from '../components/ThemeToggle';
import type { LoginRequest, AuthResponse } from '../types/auth.types';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginData: LoginRequest = { email, senha };
      const response = await api.post<AuthResponse>('/auth/login', loginData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data));

      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');

    } catch (err: any) {
      if (err.response?.data?.error === 'EMAIL_NAO_VERIFICADO') {
        toast.error('Verifique seu email antes de entrar.');
        navigate(`/verificar-email?userId=${err.response.data.usuarioId}&email=${encodeURIComponent(email)}`);
      } else {
        toast.error(err.response?.data?.message || 'Email ou senha incorretos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors">
      {/* Botão de Tema */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2 transition-colors">
        
        {/* Lado Esquerdo - Formulário */}
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              NossaGrana
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Entre na sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition"
                placeholder="seu@email.com"
                required
              />
            </div>

            <PasswordInput
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              label="Senha"
              placeholder="••••••••"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition shadow-lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <button
                onClick={() => navigate('/esqueceu-senha')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Esqueceu a senha?
              </button>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não tem conta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Criar conta grátis
              </button>
            </p>
          </div>
        </div>

        {/* Lado Direito - Informações */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 p-8 md:p-12 flex flex-col justify-center text-white transition-colors">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Organize as finanças do casal
            </h2>
            <p className="text-emerald-100 leading-relaxed">
              Controle gastos, divida despesas e alcance objetivos financeiros juntos.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Divisão automática de despesas</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Relatórios mensais e anuais</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>100% gratuito e seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};