# Base Node.js image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy all project files
COPY . .

# Set Next.js telemetry to disabled
ENV NEXT_TELEMETRY_DISABLED=1

# Set build-time environment variables
# These are placeholders for the build process only
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key_for_build
ENV ENCRYPTION_KEY=t/o1f3K4KE+0Fp1motcoZDz72oEJU14Y31Z5M8gI7jA=
ENV CSRF_SECRET=placeholder_csrf_secret_for_build_only

# Build the application
RUN npm run build

# Verify standalone build was created
RUN ls -la .next/ && \
    if [ ! -d ".next/standalone" ]; then \
      echo "ERROR: .next/standalone directory not found. Make sure output: 'standalone' is set in next.config.ts"; \
      exit 1; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Add healthcheck script
COPY --chown=nextjs:nodejs healthcheck.js .

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check to verify container is running properly
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node", "healthcheck.js"]

# Start the application
CMD ["node", "server.js"]
