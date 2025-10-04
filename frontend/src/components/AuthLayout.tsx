import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import Footer from './Footer';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Navigation */}
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link to='/' className='flex items-center space-x-2'>
                <Package className='h-8 w-8 text-primary-600' />
                <span className='text-xl font-bold text-gray-900'>
                  MERN Store
                </span>
              </Link>
            </div>

            <div className='flex items-center space-x-4'>
              <Link
                to='/products'
                className='px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors'
              >
                Back to Store
              </Link>

              <div className='flex items-center space-x-2'>
                <Link
                  to='/login'
                  className='px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors'
                >
                  Login
                </Link>
                <Link
                  to='/register'
                  className='px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors'
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className='flex-1 flex items-center justify-center'>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AuthLayout;
