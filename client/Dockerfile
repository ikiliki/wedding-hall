# Wedding Hall — client (Vite dev server).
# Built from the repo root so npm workspaces resolve `@wedding-hall/shared`.
# Vercel handles its own builds for prod; this is local docker only.

FROM node:22-alpine

WORKDIR /repo

# Install all workspace deps. Copying just the package manifests first lets
# Docker cache `npm install` across source-only edits.
COPY package.json package-lock.json* ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install --no-audit --no-fund

# Bring in the shared package source so the symlink target actually has
# files. Client + server source come in via bind mounts at runtime.
COPY packages/shared packages/shared
COPY client client

# Re-resolve workspaces after the full `client/` tree exists so devDependencies
# (Storybook, MSW, etc.) are always linked into `/repo/node_modules` in the image.
WORKDIR /repo
RUN npm install --no-audit --no-fund

WORKDIR /repo/client

ENV HOST=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 5173
EXPOSE 6006

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
