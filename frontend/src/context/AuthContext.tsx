import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, AuthContextType, Address, CreateAddressRequest, UpdateAddressRequest } from '../types/index.js';
import { authAPI, addressAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (storedAccessToken && storedRefreshToken && storedUser) {
        try {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));

          // Socket connection is handled by SocketProvider

          // Verify token with server (only if backend is available)
          try {
            const response = await authAPI.getProfile();
            setUser(response.user);
          } catch (error) {
            console.warn('Token verification failed, clearing auth data:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });

      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUser(response.user);

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Connect to socket with new access token
      try {
        // Socket connection is handled by SocketProvider
      } catch (socketError) {
        console.warn(
          'AuthContext: Socket connection failed, but login continues',
          socketError
        );
      }

      return response; // Return the response for role-based redirect
    } catch (error) {
      console.error('AuthContext: Login error', error);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    const response = await authAPI.register({ username, email, password });

    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setUser(response.user);

    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Connect to socket with new access token
    try {
      // Socket connection is handled by SocketProvider
    } catch (socketError) {
      console.warn(
        'AuthContext: Socket connection failed during registration, but registration continues',
        socketError
      );
    }

    return response; // Return the response for role-based redirect
  };

  const logout = async () => {
    // Immediately clear user state to prevent race conditions
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Socket disconnection is handled by SocketProvider
    // No need to call logout API - client-side logout is sufficient
  };

  const getUserAddresses = async (): Promise<Address[]> => {
    try {
      const response = await addressAPI.getUserAddresses();
      return response.addresses;
    } catch (error) {
      console.error('Failed to get user addresses:', error);
      throw error;
    }
  };

  const createAddress = async (addressData: CreateAddressRequest) => {
    try {
      await addressAPI.createAddress(addressData);
    } catch (error) {
      console.error('Failed to create address:', error);
      throw error;
    }
  };

  const updateAddress = async (id: string, addressData: UpdateAddressRequest) => {
    try {
      await addressAPI.updateAddress(id, addressData);
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await addressAPI.deleteAddress(id);
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      await addressAPI.setDefaultAddress(id);
    } catch (error) {
      console.error('Failed to set default address:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { username?: string; email?: string; profileImage?: { url: string; publicId: string } }) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    updateProfile,
    loading,
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
