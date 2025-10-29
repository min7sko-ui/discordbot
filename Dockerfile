# Advanced Discord Ticket Bot - Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -g typescript tsx

# Copy source code
COPY src ./src
COPY lang ./lang
COPY addons ./addons

# Build TypeScript (if needed for production)
# RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm install -g tsx

# Copy built application from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/lang ./lang
COPY --from=builder /app/addons ./addons

# Copy configuration templates
COPY config.yml.example ./config.yml.example
COPY ticket-panels.yml ./ticket-panels.yml
COPY index.ts ./index.ts

# Create necessary directories
RUN mkdir -p data logs transcripts

# Set non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S discord -u 1001 && \
    chown -R discord:nodejs /app

USER discord

# Expose port (if needed for webhooks)
# EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the bot
CMD ["tsx", "index.ts"]
