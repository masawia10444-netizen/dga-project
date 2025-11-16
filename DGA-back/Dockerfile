# === STAGE 1: BUILD (สำหรับติดตั้ง Dependencies) ===
FROM node:18-alpine AS builder

WORKDIR /usr/src/app
COPY package*.json ./
# 4. ติดตั้ง Dependencies
RUN npm install

# === STAGE 2: PRODUCTION (สำหรับรันโค้ดจริง) ===
FROM node:18-alpine

# ดึง dependencies ที่ติดตั้งแล้วมาจาก builder stage
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# 5. เปิด Port 1040
EXPOSE 1040 

# 6. คำสั่งเริ่มต้น (ใช้สำหรับ Production)
CMD [ "npm", "start" ]