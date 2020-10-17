FROM node:12-slim

WORKDIR /usr/src/app

COPY ./server .
RUN npm install
RUN npm run build
RUN npm run build -- rides-flows

