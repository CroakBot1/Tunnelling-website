# ----------------------------
# Stage 1: Build stage
# ----------------------------
FROM node:22-bullseye AS build

# Install build dependencies
RUN apt-get update && \
    apt-get install -y build-essential python3 pkg-config libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy source code
COPY . .

# ----------------------------
# Stage 2: Final image
# ----------------------------
FROM node:22-bullseye-slim

WORKDIR /app

# Copy node_modules and app from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app ./

# Expose API port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
