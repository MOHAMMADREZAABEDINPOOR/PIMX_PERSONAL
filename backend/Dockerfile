FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY src/ ./src/
COPY data/ ./data/

# Create data directory if it doesn't exist
RUN mkdir -p ./data

EXPOSE 3001

CMD ["npm", "start"]