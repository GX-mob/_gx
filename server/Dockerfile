FROM node:12-slim as development

WORKDIR /usr/src/app

COPY . .
RUN npm install
RUN npm run build
RUN npm run build -- rides-flows

FROM node:12-slim as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

COPY --from=development /usr/src/app/dist ./dist
