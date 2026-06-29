# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --ignore-scripts

FROM deps AS client-build
COPY client ./client
ENV VITE_API_URL=
RUN npm run build --workspace=client

FROM deps AS server-build
COPY server ./server
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN cd server && npx prisma generate && npm run build

FROM node:20-bookworm-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    fonts-noto-core \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    SERVE_CLIENT=true \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    UPLOAD_DIR=/data/uploads \
    PORT=3011

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/prisma ./server/prisma
COPY server/assets ./server/assets
COPY --from=client-build /app/client/dist ./client/dist
COPY client/public/courses ./client/public/courses

RUN cd server && npx prisma generate

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3011
VOLUME ["/data/uploads"]

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server/dist/src/app.js"]
