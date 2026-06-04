// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ unauthenticatedElement }) {
  const { user } = useAuth();

  // If our mock admin user session is active, pass them straight through
  if (user) {
    return <Outlet />;
  }

  // Otherwise, fallback to the login screen
  return unauthenticatedElement || <Navigate to="/login" replace />;
}