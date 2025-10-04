import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to view your cart');
      navigate('/login');
    } else {
      navigate('/cart');
    }
  };

  return (
    <footer className='bg-gray-900 text-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {/* Logo and Description */}
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <Package className='h-6 w-6 text-blue-400' />
              <span className='text-lg font-bold'>MERN Store</span>
            </div>
            <p className='text-gray-300 text-sm'>
              Your one-stop destination for quality products with fast delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div className='space-y-3'>
            <h3 className='text-sm font-semibold text-white'>Quick Links</h3>
            <div className='grid grid-cols-2 gap-2'>
              <Link
                to='/'
                className='text-gray-400 hover:text-white transition-colors text-sm'
              >
                Home
              </Link>
              <Link
                to='/login'
                className='text-gray-400 hover:text-white transition-colors text-sm'
              >
                Login
              </Link>
              <Link
                to='/register'
                className='text-gray-400 hover:text-white transition-colors text-sm'
              >
                Register
              </Link>
              <button
                onClick={handleCartClick}
                className='text-gray-400 hover:text-white transition-colors text-sm text-left'
              >
                Cart
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className='space-y-3'>
            <h3 className='text-sm font-semibold text-white'>Categories</h3>
            <div className='grid grid-cols-2 gap-2'>
              <Link
                to='/products/?category=electronics'
                className='text-gray-400 hover:text-white transition-colors text-sm'
              >
                Electronics
              </Link>
              <Link
                to='/products/?category=clothing'
                className='text-gray-400 hover:text-white transition-colors text-sm'
              >
                Clothing
              </Link>
              <Link
                to='/products/?category=books'
                className='text-gray-400 hover:text-white transition-colors text-sm'
              >
                Books
              </Link>
              <Link
                to='/'
                className='text-gray-400 hover:text-white transition-colors text-sm'
              >
                Home
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='border-t border-gray-800 mt-6 pt-6'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0'>
            <div className='text-gray-400 text-sm'>
              © {currentYear} MERN Store. All rights reserved.
            </div>
            <div className='flex space-x-4 text-sm'>
              <Link
                to='/legal-policies'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Privacy & Terms
              </Link>
              <Link
                to='/contact'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
