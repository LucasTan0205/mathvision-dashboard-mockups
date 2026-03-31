# ── Stage 1: build frontend ──────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Python API + nginx ───────────────────────────────────
FROM python:3.12-slim

# Install nginx and supervisor to run both processes
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy application code
COPY api/ ./api/
COPY analytics-engine/data/raw/ ./analytics-engine/data/raw/
COPY analytics-engine/pre-processing/ ./analytics-engine/pre-processing/
COPY analytics-engine/analytics/ ./analytics-engine/analytics/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# nginx config
COPY container/nginx.conf /etc/nginx/nginx.conf

# supervisord config to run nginx + uvicorn together
COPY container/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# DB directory — will be mounted as a volume from the db container
RUN mkdir -p /app/analytics-engine/data

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
