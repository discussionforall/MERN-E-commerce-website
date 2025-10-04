import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data.email, data.password);

      // Determine redirect based on user role
      let redirectPath = from;
      if (response && response.user?.role === 'admin') {
        redirectPath = '/admin/products';
      } else if (response && response.user?.role === 'user') {
        redirectPath = '/';
      }

      // If trying to access admin routes as non-admin, redirect to home
      if (
        from.startsWith('/admin') &&
        response &&
        response.user?.role !== 'admin'
      ) {
        redirectPath = '/';
      }

      toast.success('Login successful!');
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className='w-full max-w-md space-y-8'>
      <div>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Sign in to your account
        </h2>
        <p className='mt-2 text-center text-sm text-gray-600'>
          Or{' '}
          <Link
            to='/register'
            className='font-medium text-blue-600 hover:text-blue-500'
          >
            create a new account
          </Link>
        </p>
      </div>
      <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
        <div className='space-y-4'>
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700'
            >
              Email address
            </label>
            <div className='mt-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Mail className='h-5 w-5 text-gray-400' />
              </div>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                type='email'
                className='appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Enter your email'
              />
            </div>
            {errors.email && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700'
            >
              Password
            </label>
            <div className='mt-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Lock className='h-5 w-5 text-gray-400' />
              </div>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                className='appearance-none rounded-md relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Enter your password'
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className='h-5 w-5 text-gray-400' />
                ) : (
                  <Eye className='h-5 w-5 text-gray-400' />
                )}
              </button>
            </div>
            {errors.password && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className='flex items-center justify-end'>
          <Link
            to='/forgot-password'
            className='text-sm text-blue-600 hover:text-blue-500 font-medium'
          >
            Forgot your password?
          </Link>
        </div>

        <div>
          <button
            type='submit'
            disabled={isSubmitting}
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
