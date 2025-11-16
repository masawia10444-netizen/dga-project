const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// โหลดตัวแปรสภาพแวดล้อมจาก .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;

// ----------------------------------------------------
// 1. การตั้งค่า CORS ที่ยืดหยุ่น
// ----------------------------------------------------
// สำหรับ Dev: http://localhost:8083 (หรือพอร์ตอื่นที่ใช้รัน Vite)
// สำหรับ Prod: https://czp-staging.biza.me (หรือโดเมนจริง)
const allowedOrigins = [
    'http://localhost:8083', 
    'http://localhost:5174', // สำหรับกรณีที่รัน Vite Dev Server บนพอร์ต default 
    'https://czp-staging.biza.me' // โดเมน Staging ของคุณ
];

const corsOptions = {
    origin: (origin, callback) => {
        // อนุญาตถ้า origin อยู่ใน allowedOrigins หรือถ้าเป็น Request ที่ไม่มี origin (เช่น Postman, cURL)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    // อนุญาตให้ส่ง Credentials (เช่น Cookies, Authorization Headers)
    credentials: true, 
    // อนุญาต Methods และ Headers ที่จำเป็น
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // ⭐️ สำคัญ: ต้องระบุ Header ที่ใช้เอง (เช่น ConsumerSecret) ที่นี่
    allowedHeaders: ['Content-Type', 'Authorization', 'ConsumerSecret'], 
};

app.use(cors(corsOptions));
// ----------------------------------------------------

// Middleware พื้นฐาน
app.use(express.json()); // สำหรับการจัดการ JSON Request Body

// ----------------------------------------------------
// 2. เชื่อมต่อฐานข้อมูล MongoDB
// ----------------------------------------------------
mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB connection successful.'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        // ไม่ควรให้เซิร์ฟเวอร์รันต่อถ้าไม่มี DB
        process.exit(1);
    });

// ----------------------------------------------------
// 3. กำหนด Routes
// ----------------------------------------------------
const dgaRoutes = require('./routes/dga.route'); 
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

// ----------------------------------------------------
// 5. การใช้ Port จาก .env ใน Frontend (เพื่อให้ Frontend เรียกได้ถูก Port)
// ----------------------------------------------------
/*
ในไฟล์ src/services/AuthService.js:
const API_BASE_URL = 'http://localhost:1040'; // ต้องตรงกับ Port ใน .env
*/