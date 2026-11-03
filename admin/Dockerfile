FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG REACT_APP_API_BASE_URL=/api/v1
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV PUBLIC_URL=/manage
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
