FROM node:alpine

WORKDIR /app

COPY package*.json ./

# RUN npm ci --only=production

RUN npm install

COPY . .

RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]