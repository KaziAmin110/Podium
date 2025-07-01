# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Stage 2: Set up backend
FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend ./backend

# Copy built frontend into backend's public dir
COPY --from=frontend-builder /app/frontend/dist ./backend/public

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "app.js"]
