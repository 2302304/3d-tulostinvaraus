# Backend Dockerfile
FROM node:20-alpine

# Asenna OpenSSL Prismaa varten
RUN apk add --no-cache openssl

WORKDIR /app

# Kopioi package.json ja asenna riippuvuudet (myös devDependencies buildausta varten)
COPY package*.json ./
RUN npm ci

# Kopioi Prisma schema ja generoi client
COPY prisma ./prisma
RUN npx prisma generate

# Kopioi lähdekoodi
COPY . .

# Build TypeScript
RUN npm run build

# Poista devDependencies tuotantobuildin jälkeen
RUN npm prune --production

# Portti
EXPOSE 3000

# Käynnistä sovellus (ajaa migraatiot ensin)
CMD ["npm", "run", "start:prod"]
