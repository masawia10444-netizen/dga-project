// controllers/dga.controller.js
import * as dgaService from '../services/dga.service.js';
import { logoutUser } from '../services/auth.service.js'; // สำหรับ Logout

// 1. Controller สำหรับ /api/validate
export const handleValidate = async (req, res) => {
    try {
        const token = await dgaService.validateToken();
        res.json({ success: true, token });
    } catch (err) {
        console.error("💥 Validate Error:", err.message);
        res.status(500).json({ success: false, message: "การ Validate token ล้มเหลว", error: err.message });
    }
};

// 2. Controller สำหรับ /api/login (บันทึก User ใน Session)
export const handleLogin = async (req, res) => {
    try {
        const { appId, mToken, token } = req.body;
        if (!appId || !mToken || !token) {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }
        
        const user = await dgaService.getUserData(appId, mToken, token);
        
        // ⭐️ บันทึกข้อมูลผู้ใช้ลงใน Session
        req.session.user = user;
        console.log('✅ User data stored in session.');

        res.json({ success: true, message: "ดึงข้อมูลจาก CZP สำเร็จ", user });
    } catch (err) {
        console.error("💥 Login Error:", err.message);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ CZP", error: err.message });
    }
};

// 3. Controller สำหรับ /api/notification (ต้องการ Session)
export const handleNotification = async (req, res) => {
    try {
        const { appId, userId, token, message, sendDateTime } = req.body;
        if (!appId || !userId || !token) {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }

        const result = await dgaService.pushNotification(appId, userId, token, message, sendDateTime);
        res.json({ success: true, message: "ส่ง Notification สำเร็จ", result });
    } catch (err) {
        console.error("💥 Notification Error:", err.message);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการส่ง Notification", error: err.message });
    }
};

// 4. Controller สำหรับ /api/get-user-data (ดึงข้อมูล Session)
export const handleGetUserData = (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Unauthorized. No active session found.' });
    }
};

// 5. Controller สำหรับ /api/logout
export const handleLogout = async (req, res) => {
    try {
        await logoutUser(req);
        res.clearCookie('connect.sid'); // ล้าง Session Cookie
        res.json({ success: true, message: 'Logout successful.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to securely logout.', error: err.message });
    }
};