import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  User,
  Package,
  Home,
  Plus,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';
import Footer from './Footer';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;
  const isLandingPage = location.pathname === '/';

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Navigation */}
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link to='/' className='flex items-center space-x-2'>
                <Package className='h-6 w-6 sm:h-8 sm:w-8 text-primary-600' />
                <span className='text-lg sm:text-xl font-bold text-gray-900'>
                  MERN Store
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center space-x-4'>
              {/* Navigation Links */}
              <Link
                to='/'
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium ${
                  isActive('/')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                <Home className='h-4 w-4' />
                <span>Home</span>
              </Link>
              <Link
                to='/products'
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium ${
                  isActive('/products')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                <Package className='h-4 w-4' />
                <span>Products</span>
              </Link>
              {user && user.role !== 'admin' && (
                <Link
                  to='/orders'
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium ${
                    isActive('/orders')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  <ShoppingBag className='h-4 w-4' />
                  <span>My Orders</span>
                </Link>
              )}

              {user ? (
                <>
                  {user.role === 'admin' && (
                    <>
                      <Link
                        to='/admin/products'
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive('/admin/products')
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        <Package className='h-4 w-4' />
                        <span>Manage Products</span>
                      </Link>
                      <Link
                        to='/admin/products/new'
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive('/admin/products/new')
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        <Plus className='h-4 w-4' />
                        <span>Add Product</span>
                      </Link>
                    </>
                  )}

                  <div className='flex items-center space-x-2'>
                    {/* Notifications */}
                    {user && <NotificationBell />}

                    {/* Cart Icon */}
                    <Link
                      to='/cart'
                      className='relative flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-primary-600 transition-colors'
                    >
                      <ShoppingCart className='h-4 w-4' />
                      <span>Cart</span>
                      {cartCount > 0 && (
                        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to='/profile'
                      className='flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-primary-600 transition-colors'
                    >
                      <User className='h-4 w-4' />
                      <span>{user.username}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors'
                    >
                      <LogOut className='h-4 w-4' />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
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
              )}
            </div>

            {/* Mobile Navigation */}
            <div className='md:hidden flex items-center space-x-2'>
              {/* Mobile Navigation Links */}
              <Link
                to='/'
                className={`px-2 py-1 text-sm font-medium ${
                  isActive('/')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Home
              </Link>
              <Link
                to='/products'
                className={`px-2 py-1 text-sm font-medium ${
                  isActive('/products')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Products
              </Link>
              {user && user.role !== 'admin' && (
                <Link
                  to='/orders'
                  className={`px-2 py-1 text-sm font-medium ${
                    isActive('/orders')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Orders
                </Link>
              )}

              {user && (
                <Link
                  to='/cart'
                  className='relative flex items-center space-x-1 px-2 py-2 text-sm text-gray-700 hover:text-primary-600 transition-colors'
                >
                  <ShoppingCart className='h-5 w-5' />
                  {cartCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}

              {!user && (
                <div className='flex items-center space-x-1'>
                  <Link
                    to='/login'
                    className='px-2 py-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors'
                  >
                    Login
                  </Link>
                  <Link
                    to='/register'
                    className='px-2 py-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors'
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main
        className={`flex-1 w-full ${isLandingPage ? 'p-0' : 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'}`}
      >
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;
