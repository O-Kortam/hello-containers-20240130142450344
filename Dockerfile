FROM  node:14.17-alpine3.12  as build-step
WORKDIR /app
COPY package.json ./
RUN node -v
RUN npm install
COPY . .
RUN npm run build
RUN ls

# FROM nginx:1.16.0-alpine as prod-stage
# COPY --from=build-step /app/dist/ecommerce-frontend-new /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx","-g","daemon off;"]

FROM nginx:1.16.0-alpine as prod-stage
COPY --from=build-step /app/dist/zoom-wrapper /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200
CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/environment/env.template.js > /usr/share/nginx/html/assets/environment/env.js && exec nginx -g 'daemon off;'"]
# CMD ["nginx","-g","daemon off;"]


#docker build -t ecommercefront .
