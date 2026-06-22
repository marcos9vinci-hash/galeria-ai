FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Generate .env from Railway environment variables for Vite build
RUN echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > .env && \
    echo "AIRTOP_API_KEY=${AIRTOP_API_KEY}" >> .env && \
    echo "BUFFER_ACCESS_TOKEN=${BUFFER_ACCESS_TOKEN}" >> .env

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
