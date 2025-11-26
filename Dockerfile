# Use official Node LTS
FROM node:22-bullseye

# Install build dependencies for better-sqlite3
RUN apt-get update && \
    apt-get install -y build-essential python3 pkg-config libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy package.json & package-lock.json first (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose API port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
