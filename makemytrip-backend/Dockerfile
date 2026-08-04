# =============================================================================
# Backend — production image
# =============================================================================

# Node 22 LTS. The previous base was node:18-alpine, which reached end-of-life
# in April 2025 and receives no further security patches.
FROM node:22-alpine AS deps
WORKDIR /app

# `npm ci`, not `npm install`: it installs exactly what package-lock.json pins.
# `npm install` is free to resolve different versions than the ones tested,
# which makes the image non-reproducible.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- runtime ----------
FROM node:22-alpine
WORKDIR /app

# dumb-init reaps zombies and forwards signals correctly as PID 1.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts

# Uploads are written at runtime, so the directory has to exist AND be owned by
# the user the process runs as. Previously `COPY . .` ran as root and `USER` was
# set afterwards, leaving /app root-owned: uploadMiddleware calls
# `fs.mkdirSync` at import time, which throws EACCES for a non-root user and
# crashed the container on boot. Even past that, multer could not have written a
# file into a root-owned directory.
RUN mkdir -p /app/public/uploads && chown -R node:node /app/public

# `node` is the unprivileged user the official image already provides. The
# previous image created its own appgroup/appuser, which is the same idea but
# left every copied file owned by root.
USER node

EXPOSE 5000

# The app exposes /health and refuses to accept traffic until its secret and
# trust-proxy checks pass, so this reports real readiness, not just liveness.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form via dumb-init, NOT `npm run start`. npm as PID 1 does not forward
# SIGTERM to the node process, so the graceful-shutdown handler in src/index.js
# never ran and `docker stop` killed in-flight requests instead of draining them.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
