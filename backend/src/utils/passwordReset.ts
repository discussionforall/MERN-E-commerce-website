import crypto from 'crypto';

/**
 * Generate a secure password reset token
 * @returns {string} A random 32-byte hex string
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate password reset token with expiration
 * @returns {object} Object containing token and expiration date
 */
export const createPasswordResetToken = () => {
  const token = generatePasswordResetToken();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  return {
    token,
    expires,
  };
};

/**
 * Check if password reset token is valid and not expired
 * @param {Date} expires - Expiration date of the token
 * @returns {boolean} True if token is valid and not expired
 */
export const isPasswordResetTokenValid = (expires: Date): boolean => {
  return new Date() < expires;
};

/**
 * Hash the password reset token for storage
 * @param {string} token - The plain text token
 * @returns {string} Hashed token
 */
export const hashPasswordResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Compare password reset token with hashed token
 * @param {string} token - The plain text token
 * @param {string} hashedToken - The hashed token from database
 * @returns {boolean} True if tokens match
 */
export const comparePasswordResetToken = (
  token: string,
  hashedToken: string
): boolean => {
  const hashedInput = hashPasswordResetToken(token);
  return hashedInput === hashedToken;
};
