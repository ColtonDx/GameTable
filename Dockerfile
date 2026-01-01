# Stage 1: Build backend
FROM rust:1.75 as backend-builder
WORKDIR /app/backend
COPY backend/ .
RUN cargo build --release

# Stage 2: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 3: Runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy backend binary
COPY --from=backend-builder /app/backend/target/release/game-table-server /app/server

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build /app/public

WORKDIR /app
EXPOSE 3001

CMD ["/app/server"]
