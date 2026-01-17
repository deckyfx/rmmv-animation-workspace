# Dockerfile for RMMV Animation Studio (Monorepo)
FROM oven/bun:latest
WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies and build
RUN bun install || true
RUN bun run build:player
RUN bun run db:seed

# Seed database if it doesn't exist, then start server
CMD ["sh", "-c", "test -f /app/data/animations.db || bun run db:seed && bun run start"]
