FROM mcr.microsoft.com/playwright:v1.59.1

RUN corepack enable \
    && npm install -g npm-check-updates sort-package-json

ARG UID=1000
ARG GID=1000
# Remove default users that may conflict with the host UID/GID, then create
# a developer user matching the host UID/GID so that files written to
# bind-mounted volumes have correct ownership on Linux hosts.
RUN userdel --remove pwuser \
    && (userdel --remove ubuntu 2>/dev/null || true) \
    && groupadd --force --gid ${GID} developer \
    && useradd --uid ${UID} --gid ${GID} --create-home developer

USER developer

# Prepare pnpm as the developer user so corepack stores it in the developer's
# home directory (~/.cache/node/corepack), which is baked into the image.
# This prevents corepack from downloading pnpm again at container runtime.
RUN corepack prepare pnpm@latest --activate
