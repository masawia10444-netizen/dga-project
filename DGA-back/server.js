// DGA-back/server.js
// เปลี่ยนจาก require เป็น import ทั้งหมดเพื่อรองรับ ES Module ("type": "module" ใน package.json)

import express from 'express';
import cors from 'cors'; 
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// โหลดตัวแปรสภาพแวดล้อมจาก .env
dotenv.config();

const app = express();
// ใช้ port จาก .env หรือ default เป็น 1040 (ตามที่กำหนดใน docker-compose)
const port = process.env.PORT || 1040; 
const mongoUri = process.env.MONGO_URI;

// ----------------------------------------------------
// 1. การตั้งค่า CORS ที่ยืดหยุ่น
// ----------------------------------------------------
// สำหรับ Dev/Prod
const allowedOrigins = [
    'http://localhost:8083', 
    'http://localhost:5174', 
    'https://czp-staging.biza.me' 
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ConsumerSecret'], 
};

app.use(cors(corsOptions));
// ----------------------------------------------------

// Middleware พื้นฐาน
app.use(express.json()); 

// ----------------------------------------------------
// 2. เชื่อมต่อฐานข้อมูล MongoDB
// ----------------------------------------------------
// ตรวจสอบว่ามี URI ไหมก่อน connect
if (!mongoUri) {
    console.error('❌ FATAL ERROR: MONGO_URI is not defined in environment variables.');
    // ไม่ควรให้เซิร์ฟเวอร์รันต่อถ้าไม่มี DB
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB connection successful.'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// ----------------------------------------------------
// 3. กำหนด Routes
// ----------------------------------------------------
// ⭐️ สำคัญ: ต้องใช้ import และต้องระบุ .js extension
import dgaRoutes from './routes/dga.route.js'; 
app.use('/api', dgaRoutes); // ใช้ /api เป็น Prefix สำหรับ API ของคุณ

// Route ทดสอบ
app.get('/', (req, res) => {
    res.send('DGA Backend is running!');
});

// ----------------------------------------------------
// 4. Global Error Handler (จัดการ Error 500 ส่วนกลาง)
// ----------------------------------------------------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'An unexpected internal error occurred.',
        message: err.message
    });
});
// ----------------------------------------------------

// เริ่มต้น Server
app.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});