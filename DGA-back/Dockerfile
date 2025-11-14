# 1. ใช้ Base Image ของ Node 18
FROM node:18-alpine

# 2. ตั้งค่าที่ทำงานใน container
WORKDIR /usr/src/app

# 3. คัดลอก package.json และ package-lock.json
COPY package*.json ./

# 4. ติดตั้ง Dependencies
RUN npm install

# 5. เปิด Port ที่ backend เราใช้ (จาก .env คือ 1040)
EXPOSE 1040

# 6. คำสั่งเริ่มต้น (ซึ่ง docker-compose จะ override เป็น npm run dev)
CMD [ "npm", "run", "start" ]