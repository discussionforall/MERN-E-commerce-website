# Stage 1: Build React (Vite) app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and lock file first (for caching)
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --silent

# Copy source code
COPY . .

# Build for production
RUN npm run build


# Stage 2: Production server
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
