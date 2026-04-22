FROM hashicorp/terraform:latest

# Azure CLI is required by the azurerm Terraform provider/backend
# for CLI-based authentication (it invokes `az` to obtain tokens).
RUN apk add --no-cache python3 py3-pip shadow su-exec && \
    pip3 install --break-system-packages azure-cli

ARG UID=1000
ARG GID=1000
# Create a user matching the host user's UID/GID so that files written to
# bind-mounted volumes (e.g. .terraform/) are owned by the correct user.
RUN addgroup -g ${GID} developer \
    && adduser -u ${UID} -G developer -D developer

# Cloud credentials are bind-mounted read-only under /mnt. On macOS
# Docker Desktop they appear as root-owned with restrictive permissions,
# so the entrypoint copies them to the developer user's home directory
# with correct ownership before dropping privileges.
RUN printf '#!/bin/sh\n\
for dir in .aws .azure .config/gcloud; do\n\
  if [ -d /mnt/$dir ]; then\n\
    mkdir -p /home/developer/$dir\n\
    cp -a /mnt/$dir/. /home/developer/$dir/\n\
    chown -R developer:developer /home/developer/$dir\n\
  fi\n\
done\n\
# Azure CLI writes log files and token cache updates, so redirect\n\
# to a writable copy.\n\
if [ -d /home/developer/.azure ]; then\n\
  cp -a /home/developer/.azure /tmp/.azure\n\
  export AZURE_CONFIG_DIR=/tmp/.azure\n\
fi\n\
exec su-exec developer "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
