# Remote renderer — Playwright + Chromium in a container.
# The official Playwright image ships browser deps preinstalled; tag tracks
# the playwright version in package.json.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server/ server/

EXPOSE 8080
CMD ["node", "server/remote.mjs"]
