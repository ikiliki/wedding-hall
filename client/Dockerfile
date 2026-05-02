# Wedding Hall — client (Vite dev server)
# Used by docker-compose for local development. Vercel handles its own builds for prod.

FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

ENV HOST=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
