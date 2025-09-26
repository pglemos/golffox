
import React from 'react';
import { useAuth } from '../app/auth/AuthContext';
import AdminLogin from './AdminLogin';
import { auth } from '../lib/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await auth.signOut();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
        <span className="text-sm font-medium">Área Administrativa - Golffox</span>
        <button
          onClick={handleLogout}
          className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm"
        >
          Sair
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ProtectedRoute;
