import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useInitAuth } from '@/hooks/useInitAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthRoute } from '@/components/AuthRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { NotesListPage } from '@/pages/NotesListPage';
import { NoteEditorPage } from '@/pages/NoteEditorPage';
import { SearchPage } from '@/pages/SearchPage';
import { PublicSharePage } from '@/pages/PublicSharePage';

function App() {
  useInitAuth();

  return (
    <>
    <Toaster richColors position="top-right" />
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
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="/notes" element={<NotesListPage />} />
        <Route path="/notes/new" element={<NoteEditorPage />} />
        <Route path="/notes/:id" element={<NoteEditorPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>

      {/* Public pages — no auth required */}
      <Route path="/share/:token" element={<PublicSharePage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/notes" replace />} />
    </Routes>
    </>
  );
}

export default App;
