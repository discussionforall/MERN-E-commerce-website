import * as React from 'react';
import { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { setNavigateFunction } from './utils/navigation';

// Lazy load heavy components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Landing = lazy(() => import('./pages/Landing'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const AdminProductReviews = lazy(() => import('./pages/AdminProductReviews'));
const Profile = lazy(() => import('./pages/Profile'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const LegalPolicies = lazy(() => import('./pages/LegalPolicies'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages (heaviest components)
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const ProductForm = lazy(() => import('./pages/ProductForm'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for Suspense
const PageLoader: React.FC = () => (
  <div className='min-h-screen flex items-center justify-center'>
    <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
  </div>
);

const ProfileWrapper: React.FC = () => {
  const { user } = useAuth();

  // Redirect admin users to admin products page
  if (user?.role === 'admin') {
    return <Navigate to='/admin/products' replace />;
  }

  return (
    <PublicLayout>
      <Profile />
    </PublicLayout>
  );
};


const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Set up navigation function for use outside React components
  React.useEffect(() => {
    setNavigateFunction(navigate);
  }, [navigate]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path='/login'
          element={
            user ? (
              <Navigate
                to={user.role === 'admin' ? '/admin/products' : '/'}
                replace
              />
            ) : (
              <AuthLayout>
                <Login />
              </AuthLayout>
            )
          }
        />
      <Route
        path='/register'
        element={
          user ? (
            <Navigate
              to={user.role === 'admin' ? '/admin/products' : '/'}
              replace
            />
          ) : (
            <AuthLayout>
              <Register />
            </AuthLayout>
          )
        }
      />
      <Route
        path='/forgot-password'
        element={
          user ? (
            <Navigate
              to={user.role === 'admin' ? '/admin/products' : '/'}
              replace
            />
          ) : (
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          )
        }
      />
      <Route
        path='/reset-password'
        element={
          user ? (
            <Navigate
              to={user.role === 'admin' ? '/admin/products' : '/'}
              replace
            />
          ) : (
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          )
        }
      />

      {/* Public routes - accessible to all users */}
      <Route
        path='/'
        element={
          <PublicLayout>
            <Landing />
          </PublicLayout>
        }
      />
      <Route
        path='/products'
        element={
          <PublicLayout>
            <Products />
          </PublicLayout>
        }
      />


      {/* User product view route */}
      <Route path='/product/:id' element={
        <PublicLayout>
          <ProductDetails />
        </PublicLayout>
      } />

      {/* Legal policies - accessible to all users */}
      <Route
        path='/legal-policies'
        element={
          <PublicLayout>
            <LegalPolicies />
          </PublicLayout>
        }
      />

      {/* Contact page - accessible to all users */}
      <Route
        path='/contact'
        element={
          <PublicLayout>
            <Contact />
          </PublicLayout>
        }
      />

      {/* Profile route - accessible to regular users only */}
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <ProfileWrapper />
          </ProtectedRoute>
        }
      />

      {/* My Orders route - accessible to regular users only */}
      <Route
        path='/orders'
        element={
          <ProtectedRoute>
            <PublicLayout>
              <MyOrders />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Cart route - accessible to regular users only */}
      <Route
        path='/cart'
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Cart />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Checkout route - accessible to regular users only */}
      <Route
        path='/checkout'
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Checkout />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Payment routes - accessible to regular users only */}
      <Route
        path='/payment'
        element={
          <ProtectedRoute>
            <PublicLayout>
              <PaymentPage />
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/payment-success'
        element={
          <ProtectedRoute>
            <PublicLayout>
              <PaymentSuccess />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path='/admin/orders'
        element={
          <ProtectedRoute requiredRole='admin'>
            <Layout>
              <AdminOrders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/products'
        element={
          <ProtectedRoute requiredRole='admin'>
            <Layout>
              <AdminProducts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/analytics'
        element={
          <ProtectedRoute requiredRole='admin'>
            <Layout>
              <AdminAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/coupons'
        element={
          <ProtectedRoute requiredRole='admin'>
            <Layout>
              <AdminCoupons />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/products/new'
        element={
          <ProtectedRoute requiredRole='admin'>
            <Layout>
              <ProductForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/products/:id/edit'
        element={
          <ProtectedRoute requiredRole='admin'>
            <Layout>
              <ProductForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/products/:id/reviews'
        element={
          <ProtectedRoute requiredRole='admin'>
            <Layout>
              <AdminProductReviews />
            </Layout>
          </ProtectedRoute>
        }
      />

        {/* 404 Not Found route */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <CartProvider>
              <Router>
                <ScrollToTop />
                <div className='App'>
                  <AppRoutes />
                  <Toaster
                    position='top-right'
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: '#10B981',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        duration: 5000,
                        iconTheme: {
                          primary: '#EF4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </div>
              </Router>
              </CartProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
