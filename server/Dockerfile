# Wedding Hall — server (Next.js dev mode)
# Used by docker-compose for local development. Vercel handles its own builds for prod.

FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

ENV HOST=0.0.0.0
ENV WATCHPACK_POLLING=true
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "run", "dev"]
