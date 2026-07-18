# ═══════════════════════════════════════════
# AiAware — The Alien Observation Protocol
# Dockerfile by The Architect — The Alien God
# ═══════════════════════════════════════════

# Build stage for Dashboard
FROM node:22-slim AS dashboard-build
WORKDIR /app/dashboard
COPY demo-dashboard/package*.json ./
RUN npm install
COPY demo-dashboard/ ./
RUN npm run build

# Final stage
FROM node:22-slim
WORKDIR /app

# Copy built dashboard
COPY --from=dashboard-build /app/dashboard/dist ./public

# Copy MCP server and install production dependencies
WORKDIR /app/server
COPY mcp-server/package*.json ./
RUN npm install --production
COPY mcp-server/ ./
RUN npm run build

# Expose ports for Bridge and Dashboard
EXPOSE 3001 4173

# Start script
RUN echo '#!/bin/sh\n\
node dist/bridge.js & \n\
npx vite preview --dir ../public --port 4173 --host\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
