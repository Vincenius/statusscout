FROM node:20-alpine AS build

WORKDIR /app

# Install corepack to enable Yarn 4
RUN corepack enable

# Copy only package.json and yarn.lock and install dependencies
COPY package*.json ./

# Force node_modules mode
RUN yarn config set nodeLinker node-modules

RUN yarn

# Accept build arguments from docker-compose
ARG VITE_BASE_URL
ARG VITE_APP_URL
ARG VITE_API_URL
ARG VITE_ENABLE_ANALYTICS
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_GTM_ID

# Inject environment variables into a .env.production file for Vite
RUN echo "VITE_ENABLE_ANALYTICS=${VITE_ENABLE_ANALYTICS}" > .env.production && \
    echo "VITE_BASE_URL=${VITE_BASE_URL}" >> .env.production && \
    echo "VITE_APP_URL=${VITE_APP_URL}" >> .env.production && \
    echo "VITE_API_URL=${VITE_API_URL}" >> .env.production && \
    echo "VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}" >> .env.production && \
    echo "VITE_GTM_ID=${VITE_GTM_ID}" >> .env.production

COPY . .

RUN yarn build

# Serve static files with nginx
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
