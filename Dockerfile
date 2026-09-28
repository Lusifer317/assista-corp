# Build dependencies and production application files in a disposable builder image.
FROM node:22-bookworm-slim AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

COPY . .
RUN mkdir -p /app/data

# Minimal runtime: no npm, yarn, corepack, shell, or package manager.
FROM gcr.io/distroless/nodejs22-debian13:nonroot

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /app ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["server.js"]
