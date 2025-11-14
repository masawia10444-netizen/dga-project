# ⭐️ ใช้ Node 20 ให้เหมือนกัน
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 1040
CMD [ "node", "server.js" ]