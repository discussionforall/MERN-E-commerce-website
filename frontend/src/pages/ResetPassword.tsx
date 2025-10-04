import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error('Password does not meet requirements');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword(
        token,
        formData.password,
        formData.confirmPassword
      );

      // Clear user session since all refresh tokens are invalidated
      await logout();

      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <CheckCircle className='w-8 h-8 text-green-600' />
          </div>

          <h2 className='text-3xl font-extrabold text-gray-900 mb-4'>
            Password Reset Successful!
          </h2>

          <p className='text-gray-600 mb-6'>
            Your password has been updated successfully. You can now log in with
            your new password.
          </p>
        </div>

        <div>
          <Link
            to='/login'
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md space-y-8'>
      <div>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Reset your password
        </h2>
        <p className='mt-2 text-center text-sm text-gray-600'>
          Enter your new password below.
        </p>
      </div>

      <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
        <div className='space-y-4'>
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700'
            >
              New Password
            </label>
            <div className='mt-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Lock className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                className='appearance-none rounded-md relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Enter new password'
                required
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

            {/* Password Requirements */}
            {formData.password && (
              <div className='mt-2 space-y-1'>
                <div
                  className={`flex items-center text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordValidation.minLength ? 'bg-green-600' : 'bg-red-600'}`}
                  ></div>
                  At least 6 characters
                </div>
                <div
                  className={`flex items-center text-sm ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordValidation.hasUpperCase ? 'bg-green-600' : 'bg-red-600'}`}
                  ></div>
                  One uppercase letter
                </div>
                <div
                  className={`flex items-center text-sm ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordValidation.hasLowerCase ? 'bg-green-600' : 'bg-red-600'}`}
                  ></div>
                  One lowercase letter
                </div>
                <div
                  className={`flex items-center text-sm ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-red-600'}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordValidation.hasNumbers ? 'bg-green-600' : 'bg-red-600'}`}
                  ></div>
                  One number
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700'
            >
              Confirm New Password
            </label>
            <div className='mt-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Lock className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id='confirmPassword'
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={handleChange}
                className='appearance-none rounded-md relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                placeholder='Confirm new password'
                required
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-5 w-5 text-gray-400' />
                ) : (
                  <Eye className='h-5 w-5 text-gray-400' />
                )}
              </button>
            </div>

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className='mt-2'>
                {formData.password === formData.confirmPassword ? (
                  <div className='flex items-center text-sm text-green-600'>
                    <CheckCircle className='w-4 h-4 mr-2' />
                    Passwords match
                  </div>
                ) : (
                  <div className='flex items-center text-sm text-red-600'>
                    <AlertCircle className='w-4 h-4 mr-2' />
                    Passwords do not match
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <button
            type='submit'
            disabled={
              isLoading ||
              !passwordValidation.isValid ||
              formData.password !== formData.confirmPassword
            }
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Resetting...
              </>
            ) : (
              'Reset Password'
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

export default ResetPassword;
