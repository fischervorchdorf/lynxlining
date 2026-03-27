FROM node:22-alpine AS build

WORKDIR /app

# Dependencies zuerst (wird gecacht wenn sich package.json nicht ändert)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Tailwind CLI separat installieren für CSS-Build
RUN npm i --save-dev @tailwindcss/cli

# Source kopieren und CSS bauen
COPY . .
RUN npm run css:build

# Dev-Dependencies wieder entfernen
RUN npm prune --omit=dev

# --- Production Stage ---
FROM node:22-alpine

WORKDIR /app

COPY --from=build /app .

EXPOSE 3000

CMD ["node", "src/server.js"]
