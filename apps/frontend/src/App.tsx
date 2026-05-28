import { Routes, Route, Navigate } from 'react-router-dom';
import { useInitAuth } from '@/hooks/useInitAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthRoute } from '@/components/AuthRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

function App() {
  useInitAuth();

  return (
    <Routes>
      {/* Auth pages — redirect away if already logged in */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected pages — redirect to login if not authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>Notes (coming soon)</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
