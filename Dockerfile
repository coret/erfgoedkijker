# syntax=docker/dockerfile:1

# --- deps ---------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- builder ------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runner -------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone output bundles the server + the minimal node_modules it traced.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Liveness/readiness target: /api/health.
#
# `127.0.0.1` en niet `localhost`: in de Alpine-container resolvet `localhost` eerst naar
# `::1`, terwijl de Node-server alleen op IPv4 luistert (`HOSTNAME=0.0.0.0`). Met
# `localhost` blijft de container daardoor eeuwig `unhealthy` terwijl hij prima draait.
#
# Shell-vorm (geen JSON-array), zodat `$PORT` op runtime wordt ingevuld en de check ook
# klopt als de container met bv. `-e PORT=3003` draait.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "server.js"]
