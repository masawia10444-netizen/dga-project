# 1. Back-end Dockerfile
FROM node:18-alpine

# ตั้งค่าโฟลเดอร์ทำงานใน Container
WORKDIR /usr/src/app

# Copy package.json เข้าไปก่อน (เพื่อใช้ cache)
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# Copy โค้ดที่เหลือทั้งหมด
COPY . .

# (เราจะใช้ port จาก .env แต่บอก Docker ให้อ้างอิง 1040 ไว้)
EXPOSE 1040

# คำสั่งเริ่มต้น (จะถูก Docker Compose สั่งทับ)
CMD [ "node", "server.js" ]