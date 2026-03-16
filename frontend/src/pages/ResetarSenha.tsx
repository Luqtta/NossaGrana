import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/axios';
import { PasswordInput } from '../components/PasswordInput';
import { ThemeToggle } from '../components/ThemeToggle';

export const ResetarSenha = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem!');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres!');
      return;
    }
    if (codigo.length !== 6) {
      toast.error('Digite os 6 dígitos do código');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-senha', { email, codigo, novaSenha });
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
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
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4 text-2xl">
              🔑
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nova senha
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Digite o código que enviamos para seu email e crie uma nova senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Código de verificação
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition text-center text-2xl font-bold tracking-[0.5em] placeholder-gray-300"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>

            <PasswordInput
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              label="Nova senha"
              placeholder="••••••••"
              required
            />

            <PasswordInput
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              label="Confirmar nova senha"
              placeholder="••••••••"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-lg"
            >
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={() => navigate('/esqueceu-senha')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Solicitar novo código
            </button>
            {' · '}
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
              🛡️
            </div>
            <h2 className="text-2xl font-bold mb-3">Crie uma senha forte</h2>
            <p className="text-emerald-100 leading-relaxed">
              Sua nova senha precisa ter pelo menos 6 caracteres. Recomendamos usar letras, números e símbolos.
            </p>
          </div>
          <div className="space-y-3">
            {['Mínimo de 6 caracteres', 'Use letras maiúsculas e minúsculas', 'Adicione números e símbolos'].map(text => (
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
