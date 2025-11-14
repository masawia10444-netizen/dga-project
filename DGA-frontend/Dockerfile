# 1. ใช้ Base Image
FROM node:20-alpine

# 2. ตั้งค่าที่ทำงาน
WORKDIR /app

# 3. คัดลอก package.json
COPY package*.json ./

# 4. ติดตั้ง Dependencies
RUN npm install

# 5. เปิด Port 5174 ของ Vite
EXPOSE 5174

# 6. คำสั่งเริ่มต้น
CMD [ "npm", "run", "dev" ]