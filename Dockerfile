# Use Node.js LTS
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build frontend
RUN npm run build

# --- Production Image ---
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production && npm install better-sqlite3

# Copy build files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Create database directory
RUN mkdir -p server/db

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "server/index.js"]
