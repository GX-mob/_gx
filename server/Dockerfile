FROM node:current-slim
RUN mkdir -p /usr/server && chown -R node:node /usr
WORKDIR /usr/server
COPY . .
COPY ../shared ../
USER node 
RUN npm ci