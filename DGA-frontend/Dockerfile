# === STAGE 1: BUILD (Build Static Files) ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# ⭐️ รันคำสั่ง build ของ Vite (จะได้ไฟล์ใน /dist)
RUN npm run build 

# === STAGE 2: PRODUCTION (ใช้ Nginx เสิร์ฟ) ===
FROM nginx:alpine

# ⭐️ คัดลอกไฟล์ที่ Build แล้วจาก /app/dist ไปยัง Nginx default location
COPY --from=builder /app/dist /usr/share/nginx/html

# 5. เปิด Port 80 (Nginx Default)
EXPOSE 80 
CMD ["nginx", "-g", "daemon off;"]

# === STAGE 2: PRODUCTION (ใช้ Nginx เสิร์ฟ) ===
FROM nginx:alpine
# คัดลอกไฟล์ที่ Build แล้วจาก /app/dist ไปยัง Nginx default location
COPY --from=builder /app/dist /usr/share/nginx/html

# ⭐️ เพิ่ม: คัดลอกไฟล์ nginx.conf เข้าไปใช้ใน Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx รันบน Port 80 โดย Default
EXPOSE 80 
CMD ["nginx", "-g", "daemon off;"]