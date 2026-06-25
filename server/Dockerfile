FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json
COPY client/package.json ./client/package.json

RUN npm ci

COPY prisma ./prisma
COPY tsconfig.base.json ./tsconfig.base.json
COPY shared ./shared
COPY server ./server

RUN npm run db:generate
RUN npm run build --workspace shared
RUN npm run build --workspace server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "server"]