import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center'>
          {/* 404 Icon */}
          <div className='mx-auto h-24 w-24 text-gray-400 mb-6'>
            <Search className='h-full w-full' />
          </div>

          {/* 404 Text */}
          <h1 className='text-6xl font-bold text-gray-900 mb-4'>404</h1>
          <h2 className='text-2xl font-semibold text-gray-700 mb-2'>
            Page Not Found
          </h2>
          <p className='text-gray-600 mb-8'>
            Sorry, we couldn't find the page you're looking for.
          </p>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              to='/'
              className='inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
            >
              <Home className='h-5 w-5 mr-2' />
              Go Home
            </Link>

            <button
              onClick={() => {
                // Try to go back in history, but if no history, go to products
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate('/products');
                }
              }}
              className='inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
            >
              <ArrowLeft className='h-5 w-5 mr-2' />
              Go Back
            </button>
          </div>

          {/* Additional Help */}
          <div className='mt-8 text-sm text-gray-500'>
            <p>If you think this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
