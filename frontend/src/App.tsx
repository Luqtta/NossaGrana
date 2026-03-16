import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerificarEmail } from './pages/VerificarEmail';
import { EsqueceuSenha } from './pages/EsqueceuSenha';
import { ResetarSenha } from './pages/ResetarSenha';
import { Dashboard } from './pages/Dashboard';
import { NovaDespesa } from './pages/NovaDespesa';
import { Historico } from './pages/Historico';
import { Configuracoes } from './pages/Configuracoes';
import { Categorias } from './pages/Categorias';
import { Relatorios } from './pages/Relatorios';
import { AceitarConvite } from './pages/AceitarConvite';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function AppRoutes() {
  useKeyboardShortcuts();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verificar-email" element={<VerificarEmail />} />
      <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
      <Route path="/resetar-senha" element={<ResetarSenha />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/nova-despesa" element={<ProtectedRoute><NovaDespesa /></ProtectedRoute>} />
      <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/convite/:codigo" element={<AceitarConvite />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
