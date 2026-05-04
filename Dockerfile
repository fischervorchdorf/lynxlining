FROM node:22-alpine AS build

WORKDIR /app

# Dependencies inkl. devDependencies (Tailwind wird zum Bauen gebraucht)
# --include=dev nötig, weil Coolify NODE_ENV=production als Build-Arg setzt
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Source kopieren und CSS bauen
COPY . .
RUN npm run css:build

# Dev-Dependencies entfernen für schlankeres Production-Image
RUN npm prune --omit=dev

# --- Production Stage ---
FROM node:22-alpine

WORKDIR /app

COPY --from=build /app .

EXPOSE 3000

CMD ["node", "src/server.js"]
