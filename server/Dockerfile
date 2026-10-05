# Use lightweight Node.js 20 LTS Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose backend port
EXPOSE 5000

# Set environment to production by default
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
