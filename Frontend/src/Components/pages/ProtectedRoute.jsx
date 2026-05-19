import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute() {
  const loginstate = useSelector((state) => state.auth.status);
  if (!loginstate) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/app/dashboard" replace />;
}
