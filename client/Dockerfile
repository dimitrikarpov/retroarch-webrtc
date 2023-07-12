FROM node:alpine as build
RUN npm install --global serve
WORKDIR /app
# ENV PATH /app/node_modules/.bin:$PATH
# ARG REACT_APP_SOCKET_URL
# ENV REACT_APP_SOCKET_URL $REACT_APP_SOCKET_URL
COPY package*.json ./
# RUN npm ci --only=production
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["serve", "-s", "/app/dist"]