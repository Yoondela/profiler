# Use a lightweight Node.js image
FROM node:22-slim

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first (better caching)
COPY package*.json yarn.lock* ./

# Install dependencies
RUN yarn config set network-timeout 600000
RUN yarn install

# Copy the rest of the app
COPY . .

# Expose backend port
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]
