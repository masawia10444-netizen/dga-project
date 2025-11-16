import express from 'express';
const router = express.Router();

// ⭐️ แก้ไข: ใช้ import และระบุ .js extension สำหรับไฟล์ภายใน
import * as dgaController from '../controllers/dga.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js'; // นำเข้า Middleware ที่เราแก้ชื่อเป็น verifyToken

// 1. Route สำหรับขอ Token (getAccessToken)
router.get('/auth/validate', dgaController.getAccessToken);

// 2. Route ที่ต้องมีการยืนยันตัวตน (มี Middleware)
// ⭐️ Note: เราใช้ verifyToken ที่ export ออกมาจาก auth.middleware.js
router.get('/dga/data', verifyToken, dgaController.getDGAData); 

export default router;