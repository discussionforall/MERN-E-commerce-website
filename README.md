# MERN Store - Full-Stack E-commerce Application

A comprehensive full-stack e-commerce application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring TypeScript, Vite, Socket.io, Stripe payments, and comprehensive role-based access control.

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login with JWT tokens
- Role-based access control (Admin, User)
- Password hashing with bcrypt
- Protected routes and middleware
- Password reset functionality

### 🛍️ E-commerce Features
- **Product Management:**
  - Create, read, update, delete products (Admin)
  - Product categorization (Electronics, Clothing, Books, Home, Sports, Beauty)
  - Image upload with Cloudinary integration
  - Stock management and inventory tracking
  - Advanced search and filtering
  - Product reviews and ratings

- **Shopping Cart:**
  - Add/remove items from cart
  - Quantity management
  - Persistent cart storage
  - Real-time cart updates

- **Order Management:**
  - Complete checkout process
  - Order history and tracking
  - Order status updates
  - Admin order management

- **Payment Integration:**
  - Stripe payment processing
  - Secure payment intents
  - Payment success/failure handling
  - Test mode with Stripe test keys

### 🔄 Real-time Features
- Live product updates using Socket.io
- Real-time notifications for orders, products, and coupons
- Instant synchronization across clients
- Live cart updates

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS v4
- Clean and intuitive interface
- Loading states and error handling
- Toast notifications
- Mobile-first design

### 📊 Admin Dashboard
- Product management interface
- Order management and analytics
- Coupon management system
- User management
- Real-time statistics
- Sales analytics and reporting

## 📸 Screenshots

### Homepage
![Homepage](https://raw.githubusercontent.com/discussionforall/MERN-E-commerce-website/refs/heads/main/screenshots/homepage.png)

### Product Details
![Product Details](https://raw.githubusercontent.com/discussionforall/MERN-E-commerce-website/refs/heads/main/screenshots/product-details.png)

### Shopping Cart
![Shopping Cart](https://raw.githubusercontent.com/discussionforall/MERN-E-commerce-website/refs/heads/main/screenshots/cart.png)

### Admin - Product Management
![Admin Product Management](https://raw.githubusercontent.com/discussionforall/MERN-E-commerce-website/refs/heads/main/screenshots/admin-manage-prod.png)

### Admin - Coupon Management
![Admin Coupon Management](https://raw.githubusercontent.com/discussionforall/MERN-E-commerce-website/refs/heads/main/screenshots/admin-coupon.png)

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Stripe** for payment processing
- **Cloudinary** for image management
- **Nodemailer** for email services
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **React Query** for server state management
- **React Hook Form** for form handling
- **Socket.io Client** for real-time updates
- **Tailwind CSS v4** with Vite plugin for styling
- **Stripe React** for payment components
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Recharts** for analytics charts

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

## 🚀 Quick Start with Docker (Recommended)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MERN-Practice
```

### 2. Set up Environment Variables
Create a `.env` file in the `backend` directory:
```env
# Database
MONGODB_URI=mongodb://mongo:27017/mern-e-commerce-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5000
NODE_ENV=development

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
APP_NAME=MERN Store

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Run with Docker Compose
```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## 🗄️ Database Setup

### Seed the Database
```bash
# Create admin and user accounts with sample data
docker exec backend node dist/scripts/seed.js

# Add product categories
docker exec backend node dist/scripts/seedCategories.js

# Add sample products and users
docker exec backend node dist/scripts/seedData.js
```

### Demo Accounts
After seeding, you can use these accounts:

**Admin Account:**
- Email: `admin@example.com`
- Password: `Admin123`
- Access: Full admin dashboard, product management, order management

**User Account:**
- Email: `user@example.com`
- Password: `User123`
- Access: Shopping, cart, orders, profile

## 🛠️ Development Setup (Local)

### 1. Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && npm install
```

### 2. Start Development Servers
```bash
# Start both frontend and backend
npm run dev:all

# Or start individually
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:5173
```

### 3. Build for Production
```bash
# Build both frontend and backend
npm run build:all

# Or build individually
npm run build:backend
npm run build:frontend
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Product Endpoints
- `GET /api/products` - Get all products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/search` - Search products (public)

### Cart Endpoints
- `GET /api/cart` - Get user cart (protected)
- `POST /api/cart/add` - Add item to cart (protected)
- `PUT /api/cart/update` - Update cart item (protected)
- `DELETE /api/cart/remove/:productId` - Remove item from cart (protected)
- `DELETE /api/cart/clear` - Clear cart (protected)

### Order Endpoints
- `GET /api/orders` - Get user orders (protected)
- `GET /api/orders/:id` - Get order by ID (protected)
- `POST /api/orders` - Create order (protected)
- `PUT /api/orders/:id/status` - Update order status (admin only)

### Payment Endpoints
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent (protected)
- `POST /api/payments/confirm-payment` - Confirm payment (protected)

### Admin Endpoints
- `GET /api/admin/analytics` - Get sales analytics (admin only)
- `GET /api/admin/orders` - Get all orders (admin only)
- `PUT /api/admin/orders/:id/status` - Update order status (admin only)
```

## 🏗️ Project Structure

```
MERN-Practice/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth & validation middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Database seeding scripts
│   │   ├── services/        # External services (email, socket)
│   │   ├── types/           # TypeScript interfaces
│   │   └── index.ts         # Server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API & Socket services
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main app component
│   ├── public/              # Static assets
│   ├── Dockerfile
│   ├── nginx.conf           # Nginx configuration
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Docker Compose configuration
├── docker-compose.prod.yml  # Production Docker Compose
└── README.md
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers with Helmet
- Content Security Policy (CSP)
- XSS protection
- CSRF protection

## 🚀 Deployment

### Production with Docker
```bash
# Use production Docker Compose
docker compose -f docker-compose.prod.yml up --build

# Or build and push to registry
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml push
```

### Environment Variables for Production
Make sure to set production environment variables:
- Use production MongoDB URI
- Set strong JWT secrets
- Configure production Stripe keys
- Set up production email service
- Configure production Cloudinary

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# All tests
npm run test:all
```

### Linting and Formatting
```bash
# Check code quality
npm run check:all

# Fix linting issues
npm run fix:all

# Format code
npm run format:frontend
npm run format:backend
```

**Happy Coding! 🚀**