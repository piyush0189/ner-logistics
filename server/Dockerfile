FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests and installed modules
COPY package*.json ./
COPY node_modules ./node_modules

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start Express server
CMD ["npm", "start"]
