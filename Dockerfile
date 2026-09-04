# Use the current Node.js LTS line. Patched brace-expansion 5.x requires
# Node 20 or newer, and Node 18 is end-of-life.
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install exactly the dependency graph pinned in package-lock.json.
RUN npm ci

# Copy source code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Start the backend application
CMD ["node", "src/server/index.js"] 