FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY server.ts .
COPY .env.example .env
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
