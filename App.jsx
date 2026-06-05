// src/App.jsx
import { Toaster } from "./components/ui/toaster" // 👈 Fixed
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from './lib/query-client' // 👈 Fixed
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from './lib/AuthContext'; // 👈 Fixed
import UserNotRegisteredError from './components/UserNotRegisteredError'; // 👈 Fixed
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute'; // 👈 Fixed
import { Navigate } from 'react-router-dom';
import Login from './pages/Login'; // 👈 Fixed
import Register from './pages/Register'; // 👈 Fixed
import ForgotPassword from './pages/ForgotPassword'; // 👈 Fixed
import ResetPassword from './pages/ResetPassword'; // 👈 Fixed
import Gallery from './pages/Gallery'; // 👈 Fixed
import CalendarView from './pages/CalendarView'; // 👈 Fixed
import HomePage from './pages/HomePage'; // 👈 Fixed
import PeoplePage from './pages/PeoplePage'; // 👈 Fixed

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/people" element={<PeoplePage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
