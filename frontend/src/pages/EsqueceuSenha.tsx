import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/axios';
import { ThemeToggle } from '../components/ThemeToggle';

export const EsqueceuSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/solicitar-reset-senha', { email });
      toast.success('Código enviado! Verifique seu email.');
      navigate('/resetar-senha', { state: { email } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao enviar código');
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
              🔐
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Esqueceu a senha?
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Digite seu email e enviaremos um código para criar uma nova senha.
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-lg"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            Lembrou a senha?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>

        {/* Painel direito */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 p-8 md:p-12 flex flex-col justify-center text-white transition-colors">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-3xl">
              📧
            </div>
            <h2 className="text-2xl font-bold mb-3">Recuperação segura</h2>
            <p className="text-emerald-100 leading-relaxed">
              Você receberá um código de 6 dígitos válido por 15 minutos para redefinir sua senha com segurança.
            </p>
          </div>
          <div className="space-y-3">
            {['Código expira em 15 minutos', 'Verifique a pasta de Promoções', 'Cada código só pode ser usado uma vez'].map(text => (
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
