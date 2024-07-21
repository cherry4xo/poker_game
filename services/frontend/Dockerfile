FROM node:20.10.0-slim AS base

FROM base AS deps
WORKDIR /deps
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /build
RUN npm i -g pnpm
COPY --from=deps /deps/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base
WORKDIR /serve
RUN mkdir .next
COPY --from=build /build/public ./public
COPY --from=build /build/.next/standalone ./
COPY --from=build /build/.next/static ./.next/static

HEALTHCHECK CMD curl -f http://localhost:3000 || exit 1

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]