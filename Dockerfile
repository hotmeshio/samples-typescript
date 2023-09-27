# Base stage
FROM node:19.8.1-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Development stage
FROM base AS development
ENV NODE_ENV=development
CMD ["npm", "run", "service"]
