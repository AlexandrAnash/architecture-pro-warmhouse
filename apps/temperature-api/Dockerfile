FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm ci

COPY . .

USER node

EXPOSE 8081

CMD ["npm", "run", "server"]