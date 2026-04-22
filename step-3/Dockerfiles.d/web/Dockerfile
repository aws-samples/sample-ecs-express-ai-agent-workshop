FROM node:24-bookworm-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && npm install -g npm-check-updates sort-package-json

ARG UID=1000
ARG GID=1000
# Remove the default node user/group (UID/GID 1000) shipped with the base
# image, then create a developer user matching the host UID/GID so that files
# written to bind-mounted volumes have correct ownership on Linux hosts.
RUN userdel --remove node \
    && groupadd --gid ${GID} developer \
    && useradd --uid ${UID} --gid ${GID} --create-home developer

USER developer

# Prepare pnpm as the developer user so corepack stores it in the developer's
# home directory (~/.cache/node/corepack), which is baked into the image.
# This prevents corepack from downloading pnpm again at container runtime.
RUN corepack prepare pnpm@latest --activate

# Clear default ENTRYPOINT (/usr/bin/node) so compose "command: sh -c ..."
# is executed directly as the container command
ENTRYPOINT []
