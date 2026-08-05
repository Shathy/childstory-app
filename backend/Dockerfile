# ---- deps ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json ./
# puppeteer-core has NO bundled browser -> npm install stays fast & small
RUN npm install --omit=dev

# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-slim
WORKDIR /app

# System Chromium (Debian package) — much lighter than bundling a browser
# with puppeteer, and a better fit for a persistent container (Render/Koyeb)
# than a Lambda-oriented binary like @sparticuz/chromium.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-core \
    fonts-noto-naskh-arabic \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 4000
CMD ["node", "dist/main.js"]
