# Wedding Hall — server (Next.js dev mode).
# Built from the repo root so npm workspaces resolve `@wedding-hall/shared`.
# Vercel handles its own builds for prod; this is local docker only.

FROM node:22-alpine

WORKDIR /repo

COPY package.json package-lock.json* ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install --no-audit --no-fund

COPY packages/shared packages/shared
COPY server server

WORKDIR /repo/server

ENV HOST=0.0.0.0
ENV WATCHPACK_POLLING=true
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "run", "dev"]
