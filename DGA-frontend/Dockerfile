# --- DGA-frontend/Dockerfile ---

# 1. "Build Stage" - สร้างไฟล์ Production
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build



# 2. "Serve Stage" - ใช้เซิร์ฟเวอร์ขนาดเล็กเสิร์ฟไฟล์ที่สร้าง
# ⭐️ แก้ไข: ใช้ Node 20 เพื่อความเสถียร
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy ไฟล์ที่ Build เสร็จแล้ว (จาก Stage 1) มาใส่
COPY --from=builder /usr/src/app/dist ./dist

# ติดตั้ง "serve"
RUN npm install -g serve

# ⭐️ ตำแหน่งที่ถูกต้องสำหรับ EXPOSE และ CMD ⭐️

# เปิด Port 5174 ภายใน Container
EXPOSE 5174

# สั่งให้ 'serve' รันโฟลเดอร์ 'dist' ที่ Port 5174 ภายใน Container
CMD [ "serve", "-s", "dist", "-l", "5174" ]