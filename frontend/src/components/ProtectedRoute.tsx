import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please log in to access this page');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  // If no user, redirect to login immediately
  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // If user exists but doesn't have required role, show access denied
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 mb-4'>
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
