import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/axios';
import { PasswordInput } from '../components/PasswordInput';
import { ThemeToggle } from '../components/ThemeToggle';
import type { RegisterRequest } from '../types/auth.types';

export const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem!');
      return;
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres!');
      return;
    }

    setLoading(true);

    try {
      const registerData: RegisterRequest = { nome, email, senha };
      const response = await api.post<{ usuarioId: number; email: string; nome: string }>('/auth/register', registerData);

      toast.success('Conta criada! Verifique seu email.');
      navigate(`/verificar-email?userId=${response.data.usuarioId}&email=${encodeURIComponent(email)}`);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar conta');
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
              Criar conta
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comece a organizar as finanças
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition"
                placeholder="João Silva"
                required
                minLength={3}
              />
            </div>

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

            <PasswordInput
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              label="Confirmar Senha"
              placeholder="••••••••"
              required
            />

            <p className="text-xs text-gray-500 dark:text-gray-400">
              A senha deve ter no mínimo 6 caracteres
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-lg"
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>

        {/* Lado Direito - Informações */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 p-8 md:p-12 flex flex-col justify-center text-white transition-colors">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Junte-se a milhares de casais
            </h2>
            <p className="text-emerald-100 leading-relaxed">
              Transforme a forma como você gerencia o dinheiro.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Cadastro rápido e fácil</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Seus dados 100% seguros</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Acesso de qualquer dispositivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};