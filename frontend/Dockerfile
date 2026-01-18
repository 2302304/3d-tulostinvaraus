# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Kopioi package.json ja asenna riippuvuudet
COPY package*.json ./
RUN npm ci

# Kopioi lähdekoodi ja buildaa
COPY . .
RUN npm run build

# Tuotantoimage - nginx
FROM nginx:alpine

# Kopioi nginx konfiguraatio
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopioi buildatut tiedostot
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
