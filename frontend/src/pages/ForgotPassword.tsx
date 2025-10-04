import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setIsEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <CheckCircle className='w-8 h-8 text-green-600' />
          </div>

          <h2 className='text-3xl font-extrabold text-gray-900 mb-4'>
            Check your email
          </h2>

          <p className='text-gray-600 mb-6'>
            We've sent a password reset link to <strong>{email}</strong>
          </p>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left'>
            <div className='flex items-start'>
              <AlertCircle className='w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0' />
              <div className='text-sm text-blue-800'>
                <p className='font-medium mb-2'>Important:</p>
                <ul className='space-y-1'>
                  <li>• The link expires in 15 minutes</li>
                  <li>• Check your spam folder if you don't see it</li>
                  <li>
                    • If you didn't request this, you can safely ignore it
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <button
            onClick={() => {
              setIsEmailSent(false);
              setEmail('');
            }}
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Send another email
          </button>

          <Link
            to='/login'
            className='group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md space-y-8'>
      <div>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Forgot your password?
        </h2>
        <p className='mt-2 text-center text-sm text-gray-600'>
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </div>

      <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
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
              type='email'
              id='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
              placeholder='Enter your email address'
              required
            />
          </div>
        </div>

        <div>
          <button
            type='submit'
            disabled={isLoading}
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Sending reset link...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </div>

        <div className='text-center'>
          <Link
            to='/login'
            className='text-sm text-blue-600 hover:text-blue-500 font-medium'
          >
            ← Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
