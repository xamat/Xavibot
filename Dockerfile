# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy the build_id.txt file created by Cloud Build. This changes with each build and busts the cache.
COPY build_id.txt /build_id.txt

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set legacy OpenSSL provider for Webpack compatibility
ENV NODE_OPTIONS=--openssl-legacy-provider

# Build the React app
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node", "src/server/index.js"] 