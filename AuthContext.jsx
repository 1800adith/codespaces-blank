// src/lib/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Directly authorize a default admin developer session
  const [user, setUser] = useState({
    id: 'supabase-user-1',
    name: 'Admin Developer',
    email: 'admin@supabase.io'
  });
  const [isLoadingAuth] = useState(false);
  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);

  const navigateToLogin = () => {
    console.log("Redirecting to login layout");
  };

  const login = async (email) => {
    setUser({ id: 'supabase-user-1', name: 'Admin Developer', email });
    return { data: { user: true }, error: null };
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      navigateToLogin,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};