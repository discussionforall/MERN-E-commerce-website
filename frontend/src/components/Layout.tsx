import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Package, Plus, ShoppingBag, BarChart3, Tag } from 'lucide-react';
import Footer from './Footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Navigation */}
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link
                to='/admin/products'
                className='flex items-center space-x-2'
              >
                <Package className='h-8 w-8 text-primary-600' />
                <span className='text-xl font-bold text-gray-900'>
                  MERN Store
                </span>
              </Link>
            </div>

            <div className='flex items-center space-x-4'>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <>
                      <Link
                        to='/admin/analytics'
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive('/admin/analytics')
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        <BarChart3 className='h-4 w-4' />
                        <span>Analytics</span>
                      </Link>
                      <Link
                        to='/admin/orders'
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive('/admin/orders')
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        <ShoppingBag className='h-4 w-4' />
                        <span>Manage Orders</span>
                      </Link>
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
                        to='/admin/coupons'
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive('/admin/coupons')
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        <Tag className='h-4 w-4' />
                        <span>Manage Coupons</span>
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
                    <div className='flex items-center space-x-1 text-sm text-gray-700'>
                      <User className='h-4 w-4' />
                      <span>{user.username}</span>
                    </div>
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
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className='flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full'>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
