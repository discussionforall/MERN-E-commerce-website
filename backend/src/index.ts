import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import paymentRoutes from './routes/paymentRoutes';
import orderRoutes from './routes/orders';
import analyticsRoutes from './routes/analytics';
import addressRoutes from './routes/addresses';
import reviewRoutes from './routes/reviews';
import wishlistRoutes from './routes/wishlist';
import couponRoutes from './routes/coupons';
import categoryRoutes from './routes/categories';
import uploadRoutes from './routes/upload';
import { SocketData } from './types';
import { setSocketIO } from './services/socketService';

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for rate limiting (needed for ngrok and production)
app.set('trust proxy', 1);

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.1.29:5173', 'http://frontend:80', 'https://f6ee1c325d7a.ngrok-free.app'],
    methods: ['GET', 'POST'],
  },
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.1.29:5173', 'http://frontend:80', 'https://f6ee1c325d7a.ngrok-free.app'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');

// Webhook route (must be before JSON parsing middleware)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').stripeWebhook);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);

// Root route - serve index page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'MERN RBAC E-commerce API',
    message: 'Welcome to the MERN RBAC E-commerce Backend API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    socket.data = {
      userId: decoded.userId,
      role: decoded.role,
    } as SocketData;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Set the Socket.IO instance for use in other modules
setSocketIO(io);

// Socket.io connection handling
io.on('connection', socket => {
  console.log(`User connected: ${socket.data.userId} (${socket.data.role})`);

  // Join user to their role-based room
  socket.join(socket.data.role);
  socket.join(socket.data.userId);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  }
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

export { io };
