# ----- STAGE 1: Build Frontend (React) -----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy package.json files from DGA-frontend
COPY DGA-frontend/package.json DGA-frontend/package-lock.json* ./
RUN npm install
# Copy the rest of DGA-frontend
COPY DGA-frontend ./
RUN npm run build

# ----- STAGE 2: Build Backend (Node.js) -----
FROM node:18-alpine
WORKDIR /app
# Copy package.json files from DGA-back
COPY DGA-back/package.json DGA-back/package-lock.json* ./
RUN npm install
# Copy the rest of DGA-back
COPY DGA-back ./

# ⭐️ Copy React ที่ Build เสร็จแล้ว (จาก Stage 1)
# ⭐️ ไปยังโฟลเดอร์ 'public' ใน Backend
COPY --from=frontend-builder /app/frontend/dist ./public

# ⭐️ เปิด Port 1040 ตามที่ .env กำหนด
EXPOSE 1040
CMD [ "node", "server.js" ]