# Dorevia Lynki — Build Next.js puis exécution (standalone)
# Spec: ZeDocs/web14/SPEC_DOREVIA_LINKY_UI_v2.0.md
# Port exposé: 3000 (reverse_proxy Caddy)

# Étape 1 — Build
FROM node:20-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* inlinés à la compilation (spec Trésorerie v1.1 CTAs Odoo)
ARG NEXT_PUBLIC_ODOO_URL
ENV NEXT_PUBLIC_ODOO_URL=${NEXT_PUBLIC_ODOO_URL:-https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo}
# Preuve de déploiement : court hash git passé au build (voir docker-compose lab / rebuild-linky.sh)
ARG NEXT_PUBLIC_LINKY_UI_BUILD_REF=unknown
ENV NEXT_PUBLIC_LINKY_UI_BUILD_REF=${NEXT_PUBLIC_LINKY_UI_BUILD_REF}

COPY package.json package-lock.json* ./
# npm install tant que package-lock.json n'inclut pas recharts ; passer à "npm ci" après npm install local
RUN npm install

COPY . .
RUN npm run build

# Étape 2 — Production (standalone pour réduire la taille)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Préférer IPv4 pour résolution DNS des services (Vault, DVIG) — évite timeouts en Docker
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

CMD ["node", "server.js"]
