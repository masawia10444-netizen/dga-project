# 2. Front-end Dockerfile
FROM node:20

WORKDIR /usr/src/app

# บังคับใช้ registry ปกติ
RUN npm config set registry https://registry.npmjs.org/

# อัปเดต npm (แก้บั๊ก npm 10.x ที่เจอ cancel)
RUN npm install -g npm@latest

COPY package*.json ./

# ใช้ --force เพื่อข้าม dependency conflict
RUN npm install --force

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
