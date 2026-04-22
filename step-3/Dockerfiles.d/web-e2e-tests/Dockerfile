FROM node:24

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium to a fixed system path so any UID can find it at runtime.
# Without PLAYWRIGHT_BROWSERS_PATH the default is ~/.cache/ms-playwright, which
# differs between root (build time) and the node user (run time).
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/local/ms-playwright
RUN corepack enable \
    && npm install -g npm-check-updates sort-package-json \
    && npx playwright install --with-deps chromium \
    && chmod -R a+rx ${PLAYWRIGHT_BROWSERS_PATH}

ARG UID=1000
ARG GID=1000
# node:24 ships a built-in "node" user at UID/GID 1000.
# Re-map it to the host user's UID/GID so that files written to bind-mounted
# volumes are owned by the correct user, and Node.js os.userInfo() resolves
# the user natively without /etc/passwd workarounds.
RUN groupmod --gid ${GID} node \
    && usermod --uid ${UID} --gid ${GID} node \
    && chown -R node:node /home/node

USER node

# Prepare pnpm as the node user so corepack stores it in the node user's
# home directory (~/.cache/node/corepack), which is baked into the image.
# This prevents corepack from downloading pnpm again at container runtime.
RUN corepack prepare pnpm@latest --activate
