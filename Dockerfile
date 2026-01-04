# Stage 1: Build backend with minimal footprint
FROM rust:1.75-slim as backend-builder
WORKDIR /app/backend
COPY backend/ .
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release 2>&1 && \
    rm -rf target/release/deps target/release/build target/release/.fingerprint target/release/incremental || true
RUN mkdir -p /app/backend/release-bin && \
    cp target/release/game-table-server /app/backend/release-bin/ 2>/dev/null || true

# Stage 2: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY frontend/ .
RUN npm run build

# Stage 3: Runtime - minimal image
FROM debian:bookworm-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# Copy backend binary
COPY --from=backend-builder /app/backend/release-bin/game-table-server /app/server

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build /app/public

WORKDIR /app
EXPOSE 3001

CMD ["/app/server"]
