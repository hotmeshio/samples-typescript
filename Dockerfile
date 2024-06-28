# Start from the node:20-bullseye-slim base image
FROM node:20-bullseye-slim AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# keep the container running
CMD ["tail", "-f", "/dev/null"]

