# ----- STAGE 1: Build Frontend (React) -----
# ⭐️ ใช้ Node 20 (ตามที่เราค้นพบ)
FROM node:20-alpine AS builder 
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ----- STAGE 2: Serve (ด้วย Nginx) -----
FROM nginx:alpine
# ลบ config เริ่มต้น
RUN rm /etc/nginx/conf.d/default.conf
# Copy config ของเรา (ดูไฟล์ถัดไป)
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
# Copy React ที่ Build เสร็จแล้ว
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80