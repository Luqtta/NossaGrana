import { useState } from 'react';
import { Home, History, FileText, Settings, LogOut, Tag, Plus, Menu, X, ArrowRightLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar = ({ onLogout }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = (user.nome || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Plus, label: 'Nova Despesa', path: '/nova-despesa' },
    { icon: History, label: 'Histórico', path: '/historico' },
    { icon: Tag, label: 'Categorias', path: '/categorias' },
    { icon: ArrowRightLeft, label: 'Compensações', path: '/compensacoes' },
    { icon: FileText, label: 'Relatórios', path: '/relatorios' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">NossaGrana</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Finanças do Casal</p>
        </div>
        {/* Close button - only on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <Icon size={20} />
              <span className="text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={() => handleNavigate('/configuracoes')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          {user.fotoPerfil ? (
            <img
              src={user.fotoPerfil}
              alt="Perfil"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-sm font-bold border border-emerald-200 dark:border-emerald-800">
              {userInitials || 'NG'}
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user.nome || 'Perfil'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ver perfil</p>
          </div>
        </button>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tema</span>
          <ThemeToggle />
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col transition-colors flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md"
      >
        <Menu size={22} className="text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};
