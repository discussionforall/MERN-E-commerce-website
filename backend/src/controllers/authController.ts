import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { RegisterRequest, LoginRequest, RefreshTokenPayload, ForgotPasswordRequest, ResetPasswordRequest } from '../types';
import { getSocketIO } from '../services/socketService';
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../services/emailService';
import { createPasswordResetToken, hashPasswordResetToken, comparePasswordResetToken, isPasswordResetTokenValid } from '../utils/passwordReset';

const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: '15m', // 15 minutes
  });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '30s', // 7 days
  });
};

export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response
) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken',
      });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Emit analytics event for new user registration
    try {
      const io = getSocketIO();
      io.emit('analytics:updated', { type: 'user_registered', data: { userId: user._id, role: user.role } });
    } catch (error) {
      // Socket.IO not available for user registration event
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in user document
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response
) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in user document
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as RefreshTokenPayload;
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id, user.email, user.role);

    res.json({
      message: 'Token refreshed successfully',
      accessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const user = (req as any).user;

    if (refreshToken && user) {
      // Remove the specific refresh token
      user.refreshTokens = user.refreshTokens.filter((token: string) => token !== refreshToken);
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logoutAll = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user) {
      // Remove all refresh tokens
      user.refreshTokens = [];
      await user.save();
    }

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { username, email, profileImage } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordRequest>,
  res: Response
) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }

    // Generate password reset token
    const { token, expires } = createPasswordResetToken();
    const hashedToken = hashPasswordResetToken(token);

    // Save token and expiration to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expires;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, token, user.username);
      
      res.json({
        message: 'Password reset email sent successfully. Please check your email.',
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // Clear the reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordRequest>,
  res: Response
) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the token to compare with stored token
    const hashedToken = hashPasswordResetToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired password reset token' 
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear all refresh tokens for security
    user.refreshTokens = [];
    
    // Mark password as modified to ensure it gets hashed
    user.markModified('password');
    
    await user.save();

    // Send success email
    try {
      await sendPasswordResetSuccessEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Error sending password reset success email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};