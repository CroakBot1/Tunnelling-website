# Stage 1: Build stage
FROM node:22-bullseye AS build

# Install build tools for native modules
RUN apt-get update && \
    apt-get install -y build-essential python3 pkg-config libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files & install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy source code
COPY . .

# Stage 2: Final image (slim)
FROM node:22-bullseye-slim

WORKDIR /app

# Copy node_modules & app from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app ./ 

EXPOSE 3000

# Start backend
CMD ["node", "server.js"]
