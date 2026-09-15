ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=alpine

FROM docker.io/library/node:${NODE_VERSION} AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

COPY . .
RUN npm run build

FROM docker.io/library/nginx:${NGINX_VERSION}
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
