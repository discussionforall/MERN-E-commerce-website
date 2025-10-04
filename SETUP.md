# Quick Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### 2. Installation
```bash
# Clone and navigate to project
git clone <your-repo-url>
cd MERN-Practice

# Install all dependencies
npm run install-all
```

### 3. Environment Setup
The `.env` file is already configured in the backend directory with default values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern-rbac-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:

**Ubuntu/Debian:**
```bash
sudo systemctl start mongod
```

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Windows:**
```bash
net start MongoDB
```

**Or start manually:**
```bash
mongod --dbpath /path/to/your/db
```

### 5. Seed Database (Optional)

**Create admin user only:**
```bash
npm run seed
```

**Create admin user + sample data:**
```bash
npm run seed-data
```

This creates:
- Admin user: `admin@example.com` / `Admin123`
- Regular user: `user@example.com` / `User123`
- Sample products for testing

### 6. Start the Application
```bash
# From project root
npm run dev
```

This will start:
- Backend server: http://localhost:5000
- Frontend server: http://localhost:5173

### 7. Access the Application
1. Open http://localhost:5173 in your browser
2. Register a new user or login with admin credentials
3. Explore the features based on your role

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Create admin user
cd backend && npm run seed
```

## 🧪 Testing the Setup

Run the setup test to verify everything is working:
```bash
node test-setup.js
```

## 📱 Features Overview

### For All Users
- User registration and login
- View all products
- Search and filter products
- Real-time updates via Socket.io

### For Admin Users
- Create, edit, and delete products
- Manage product categories
- View all products with admin controls
- Real-time product management

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify MongoDB is accessible on the default port (27017)

### Port Already in Use
- Backend (5000): Change PORT in `.env`
- Frontend (5173): Vite will automatically use the next available port

### Build Errors
- Run `npm run install-all` to ensure all dependencies are installed
- Check Node.js version (should be v16 or higher)
- Clear node_modules and reinstall if needed

### Socket.io Connection Issues
- Ensure backend is running before frontend
- Check CORS settings in backend
- Verify JWT token is valid

## 📁 Project Structure
```
MERN-Practice/
├── backend/          # Express.js API server
├── frontend/         # React frontend application
├── package.json      # Root package.json for scripts
├── README.md         # Detailed documentation
├── SETUP.md          # This quick setup guide
└── test-setup.js     # Setup verification script
```

## 🔐 Default Credentials

**Admin User:**
- Email: admin@example.com
- Password: admin123
- Role: admin

**Regular User:**
- Register through the UI
- Role: user (default)

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Run `node test-setup.js` to verify setup
3. Check the console for error messages
4. Ensure all prerequisites are installed

Happy coding! 🎉
