import nodemailer from 'nodemailer';

// Create transporter with flexible configuration
const createTransporter = () => {
  // Default Gmail configuration
  const config: any = {
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Connection timeout
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    // Retry configuration
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 20000, // 20 seconds
    rateLimit: 5, // max 5 emails per rateDelta
  };

  // If custom host is provided, use it instead of service
  if (process.env.EMAIL_HOST && process.env.EMAIL_HOST !== 'smtp.gmail.com') {
    delete config.service;
  }

  return nodemailer.createTransport(config);
};

// Verify transporter connection
const verifyTransporter = async (transporter: any) => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email server verification failed:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  username: string
) => {
  try {
    const transporter = createTransporter();

    // Verify connection before sending
    const isVerified = await verifyTransporter(transporter);
    if (!isVerified) {
      throw new Error('Email server connection failed');
    }
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'E-Commerce App'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              color: #1f2937;
              margin: 0;
            }
            .content {
              margin-bottom: 30px;
            }
            .greeting {
              font-size: 18px;
              color: #374151;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .reset-button {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            .reset-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
            }
            .token-info {
              background: #f3f4f6;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .token-label {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .token-value {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              color: #1f2937;
              font-weight: 600;
              word-break: break-all;
            }
            .expiry {
              font-size: 14px;
              color: #ef4444;
              font-weight: 600;
              margin-top: 20px;
              text-align: center;
            }
            .footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
            .security-note {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              font-size: 14px;
              color: #92400e;
            }
            .security-note strong {
              color: #b45309;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛍️ E-Commerce</div>
              <h1 class="title">Password Reset Request</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hello ${username}!</p>
              
              <p class="message">
                We received a request to reset your password for your account. If you made this request, 
                click the button below to reset your password. If you didn't make this request, 
                you can safely ignore this email.
              </p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="reset-button">
                  Reset My Password
                </a>
              </div>
              
              <div class="token-info">
                <div class="token-label">Or copy and paste this link in your browser:</div>
                <div class="token-value">${resetUrl}</div>
              </div>
              
              <div class="expiry">
                ⏰ This link will expire in 15 minutes
              </div>
              
              <div class="security-note">
                <strong>Security Note:</strong> If you didn't request this password reset, 
                please ignore this email. Your password will remain unchanged.
              </div>
            </div>
            
            <div class="footer">
              <p>This email was sent from ${process.env.APP_NAME || 'E-Commerce App'}</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (
  email: string,
  username: string
) => {
  try {
    const transporter = createTransporter();

    // Verify connection before sending
    const isVerified = await verifyTransporter(transporter);
    if (!isVerified) {
      throw new Error('Email server connection failed');
    }

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'E-Commerce App'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #10b981;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              color: #1f2937;
              margin: 0;
            }
            .content {
              margin-bottom: 30px;
            }
            .greeting {
              font-size: 18px;
              color: #374151;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .success-icon {
              text-align: center;
              font-size: 48px;
              margin: 20px 0;
            }
            .footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛍️ E-Commerce</div>
              <h1 class="title">Password Reset Successful</h1>
            </div>
            
            <div class="content">
              <div class="success-icon">✅</div>
              
              <p class="greeting">Hello ${username}!</p>
              
              <p class="message">
                Your password has been successfully reset. You can now log in to your account 
                using your new password. If you didn't make this change, please contact our 
                support team immediately.
              </p>
            </div>
            
            <div class="footer">
              <p>This email was sent from ${process.env.APP_NAME || 'E-Commerce App'}</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset success email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    throw error;
  }
};
