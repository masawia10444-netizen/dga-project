// server.js (ES Modules)

// Import Libraries
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import 'dotenv/config'; // Syntax ใหม่สำหรับ .env ใน ES Modules

// Import Routes
import dgaRoutes from './routes/dga.route.js'; // *** ต้องเพิ่ม .js นามสกุล ***

const app = express();
const PORT = process.env.PORT || 1040;

// ... (Middleware, CORS, Session Settings เหมือนเดิม) ...

// --- Route Integration ---
app.use('/api', dgaRoutes); 

// Endpoint ทดสอบสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
    res.send({ status: 'Server is running', api_path: '/api/validate' });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});