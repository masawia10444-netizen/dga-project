import express from 'express';
const router = express.Router();

// ⭐️ Named Import: ดึงฟังก์ชันที่ต้องการจาก Controller มาโดยตรง
import { getAccessToken, getDGAData } from '../controllers/dga.controller.js';

// ⭐️ Named Import: ดึงฟังก์ชัน Middleware ที่ต้องการมาโดยตรง
import { verifyToken } from '../middleware/auth.middleware.js'; 

// 1. Route สำหรับขอ Token (ไม่ต้องมี Middleware)
// เรียกใช้ฟังก์ชันโดยตรง
router.get('/auth/validate', getAccessToken);

// 2. Route ที่ต้องมีการยืนยันตัวตน (มี Middleware)
// เรียกใช้ฟังก์ชันโดยตรง
router.get('/dga/data', verifyToken, getDGAData); 

export default router;