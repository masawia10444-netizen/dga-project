# --- DGA-frontend/Dockerfile ---

# 1. "Build Stage" - สร้างไฟล์ Production
FROM node:20-alpine AS builder 
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .
# ⭐️ นี่คือคำสั่ง "Build" มันจะอ่าน vite.config.js (base: '/test5/')
# แล้วสร้างไฟล์นิ่งๆ (static) ไว้ในโฟลเดอร์ /dist
RUN npm run build

# 2. "Serve Stage" - ใช้เซิร์ฟเวอร์ขนาดเล็กเสิร์ฟไฟล์ที่สร้าง
FROM node:20-alpine 
WORKDIR /usr/src/app

# Copy ไฟล์ที่ Build เสร็จแล้ว (จาก Stage 1) มาใส่
COPY --from=builder /usr/src/app/dist ./dist

# ติดตั้ง "serve" - เซิร์ฟเวอร์ไฟล์นิ่งที่เบาและเสถียร
RUN npm install -g serve

# เปิด Port 5174 (Port ภายใน Container)
EXPOSE 5174

# ⭐️ สั่งให้ 'serve' รันโฟลเดอร์ 'dist'
# (-s คือ Single-Page App mode)
CMD [ "serve", "-s", "dist", "-l", "5174" ]