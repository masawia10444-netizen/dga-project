// routes/dga.route.js
import express from 'express';
const router = express.Router();
import { isAuthenticated } from '../middleware/auth.middleware.js'; // นำเข้า Middleware

import { 
    handleValidate, 
    handleLogin, 
    handleNotification, 
    handleGetUserData,
    handleLogout 
} from '../controllers/dga.controller.js'; 

// Route DGA API (Public Access)
router.get("/validate", handleValidate);
router.post("/login", handleLogin);

// Route DGA API (Protected Access - ต้อง Login ก่อน)
router.post("/notification", isAuthenticated, handleNotification); 
router.get("/get-user-data", handleGetUserData);

// Route สำหรับจัดการ Session
router.post("/logout", handleLogout); 

export default router;