# Use a lightweight Node.js image
FROM node:22-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy only package files first (for better caching)
COPY package*.json yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy rest of the code
COPY . .

# Expose your backend port
EXPOSE 3000

# Define startup command
CMD ["yarn", "start"]
