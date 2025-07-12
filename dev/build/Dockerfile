# ====================
# --- Build Assets ---
# ====================
FROM node:20-alpine AS assets

RUN apk add yarn g++ make cmake python3 --no-cache

WORKDIR /wiki

# Copy package files first to leverage Docker layer caching
COPY ./package.json ./package.json
# Copy yarn.lock if it exists (this will be ignored if file doesn't exist)
COPY ./yarn.loc[k] ./

# Install dependencies first - this layer will be cached unless package.json changes
RUN yarn cache clean
RUN yarn --frozen-lockfile --non-interactive

# Copy source files after dependencies are installed
COPY ./client ./client
COPY ./dev ./dev
COPY ./patches ./patches
COPY ./.babelrc ./.babelrc
COPY ./.eslintignore ./.eslintignore
COPY ./.eslintrc.yml ./.eslintrc.yml

# Build the application
RUN yarn build

# Clean up and install production dependencies
RUN rm -rf /wiki/node_modules
RUN yarn --production --frozen-lockfile --non-interactive
RUN yarn patch-package

# ===============
# --- Release ---
# ===============
FROM node:20-alpine
LABEL maintainer="requarks.io"

RUN apk add bash curl git openssh gnupg sqlite --no-cache && \
    mkdir -p /wiki && \
    mkdir -p /logs && \
    mkdir -p /wiki/data/content && \
    chown -R node:node /wiki /logs

WORKDIR /wiki

COPY --chown=node:node --from=assets /wiki/assets ./assets
COPY --chown=node:node --from=assets /wiki/node_modules ./node_modules
COPY --chown=node:node ./server ./server
COPY --chown=node:node --from=assets /wiki/server/views ./server/views
COPY --chown=node:node ./dev/build/config.yml ./config.yml
COPY --chown=node:node ./package.json ./package.json
COPY --chown=node:node ./LICENSE ./LICENSE

USER node

VOLUME ["/wiki/data/content"]

EXPOSE 3000
EXPOSE 3443

# HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 CMD curl -f http://localhost:3000/healthz

CMD ["node", "server"]
