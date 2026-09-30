import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from './LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { account, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Authenticating session..." />;
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Authentication Required</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          Please log in to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
