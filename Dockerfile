# Étape 1 : Build de l'application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur de production (Nginx)
FROM nginx:stable-alpine
# Copie du build vers le répertoire Nginx
COPY --from=build/app/dist/usr/share/nginx/html
# Copie d'une config personnalisée pour gérer le React Router
COPY nginx.conf/etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]