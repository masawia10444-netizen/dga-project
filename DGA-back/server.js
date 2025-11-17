// server.js 
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import 'dotenv/config'; // โหลดตัวแปร ENV ตั้งแต่เริ่มต้น

// 🚨 นำเข้า Route ที่เราได้สร้างและ export default ไว้ใน dga.route.js
import dgaRoutes from './routes/dga.route.js'; 

const app = express();
// ใช้ Port 1040 ตาม .env หรือค่า default
const PORT = process.env.PORT || 1040; 

// --- Middleware Setup ---
// อนุญาตให้ Frontend (CORS) เข้าถึงได้ และอนุญาตให้ส่ง Cookie (Session) ข้ามโดเมนได้
app.use(cors({ origin: true, credentials: true })); 
app.use(express.json());

// ตั้งค่า Session (สำคัญสำหรับ Session-based Auth)
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // ใช้ Secure Cookie ใน Production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1 ชั่วโมง
    }
}));

console.log("🔧 Server Setup Complete.");


// --- Routes Setup ---
// ⭐️ เชื่อมต่อ dgaRoutes โดยมี base path เป็น /api
app.use('/api', dgaRoutes); 

// Endpoint ทดสอบสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
    res.send({ status: 'Server is running', api_path: '/api/validate' });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // ตรวจสอบสถานะ ENV DGA คร่าวๆ (ตรวจสอบแบบเข้มงวดอยู่ใน dga.service.js แล้ว)
    if (!process.env.AGENT_ID || !process.env.CONSUMER_KEY || !process.env.CONSUMER_SECRET) {
        console.warn("⚠️ WARNING: DGA credentials check is done in dga.service.js. Ensure your .env is correct.");
    }
});