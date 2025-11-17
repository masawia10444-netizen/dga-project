// routes/dga.route.js (เพิ่ม)
import express from 'express';
const router = express.Router();
import { 
    handleValidate, 
    handleLogin, 
    handleNotification, 
    handleGetUserData,
    handleLogout // 👈 นำเข้า handleLogout
} from '../controllers/dga.controller.js'; 
import { isAuthenticated } from '../middleware/auth.middleware.js'; // 👈 นำเข้า isAuthenticated

// Route DGA API
router.get("/validate", handleValidate);
router.post("/login", handleLogin);
// ใช้ Middleware ตรวจสอบก่อนเข้าถึง Notification
router.post("/notification", isAuthenticated, handleNotification); 

// Route สำหรับดึงข้อมูล Session
router.get("/get-user-data", handleGetUserData);

// 👈 เพิ่ม Route สำหรับ Logout
router.post("/logout", handleLogout); 

export default router;