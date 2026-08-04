# =============================================================================
# Frontend — multi-stage production build
# Stage 1 builds the Vite SPA; stage 2 ships only the compiled static files.
# The nginx container in docker-compose.prod.yml mounts /dist as its docroot.
# =============================================================================

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci

# Build-time config: the backend API base URL is injected at build time.
# Override with --build-arg in CI/CD for each environment.
ARG VITE_API_BASE_URL=http://localhost:5000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ---------- Stage 2: ship static files ----------
# A plain nginx-free image: the composed nginx service copies dist/ out of it.
FROM alpine:3.20
COPY --from=build /app/dist /dist
# Keep the image non-empty and self-describing.
CMD ["echo", "Frontend build artifacts are in /dist"]
