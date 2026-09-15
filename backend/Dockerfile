# Single-stage, deliberately simple — this is a small hobby-scale API, not
# a size-optimized production image. node:20-slim (Debian/glibc) rather than
# alpine, because bcrypt is a native module and its prebuilt binaries target
# glibc; alpine (musl) would force a from-source compile requiring extra
# build tooling in the image.
FROM node:20-slim

WORKDIR /app

# Prisma needs to detect libssl to pick the right query-engine binary —
# without it, it silently guesses (openssl-1.1.x) which can be wrong on a
# given host and fail at runtime instead of at build time.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy just what's needed for `npm ci` first, including the Prisma schema —
# @prisma/client's postinstall step runs `prisma generate` during npm ci,
# and needs the schema present to do that. Keeps Docker's layer cache warm
# across source-only changes.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Applies any pending migrations, then starts the server. Fine for a single
# instance; a multi-instance deploy should run migrations as a separate
# release/pre-deploy step instead of on every container boot.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
