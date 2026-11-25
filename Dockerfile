FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && node mobile/scripts/build-www.mjs --check

ENV NODE_ENV=production
ENV PORT=8088

EXPOSE 8088

CMD ["npx", "tsx", "src/server/index.ts"]
