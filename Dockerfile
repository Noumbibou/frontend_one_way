# Frontend Dockerfile (React + Nginx)
# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for caching
COPY package*.json /app/
RUN npm ci

# Copy source and build
COPY . /app
# Build-time API base URL (can be overridden by build arg)
ARG REACT_APP_API_BASE_URL=
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

# 2) Runtime stage (Nginx)
FROM nginx:1.27-alpine AS runtime

# Copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
