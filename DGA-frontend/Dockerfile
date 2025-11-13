# 2. Front-end Dockerfile
FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Expose port ของ Vite
EXPOSE 5173

# สั่งให้ Vite รันและยอมรับการเชื่อมต่อจากภายนอก
CMD [ "npm", "run", "dev", "--", "--host" ]