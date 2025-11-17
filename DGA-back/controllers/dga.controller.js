// controllers/dga.controller.js
// ใช้ * as เพื่อนำเข้าทั้งหมดที่เป็น Named export
import * as dgaService from '../services/dga.service.js'; 
import { logoutUser } from '../services/auth.service.js';

// 1. Controller สำหรับ /api/validate
export const handleValidate = async (req, res) => { // ใช้ export const แทน exports.handleValidate = 
    try {
        const token = await dgaService.validateToken();

        res.json({
            success: true,
            token: token,
        });
    } catch (err) {
        console.error("💥 Validate Error:", err.response?.data || err.message);
        res.status(500).json({
            success: false,
            message: "การ Validate token ล้มเหลว",
            error: err.response?.data || err.message,
        });
    }
};

// 2. Controller สำหรับ /api/login
export const handleLogin = async (req, res) => { // ใช้ export const แทน exports.handleLogin = 
    try {
        const { appId, mToken, token } = req.body;

        if (!appId || !mToken || !token) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing appId, mToken, or token in request body" 
            });
        }
        
        const user = await dgaService.getUserData(appId, mToken, token);
        
        req.session.user = user;
        console.log('✅ User data stored in session.');

        res.json({
            success: true,
            message: "ดึงข้อมูลจาก CZP สำเร็จ",
            user,
        });
    } catch (err) {
        console.error("💥 Login Error:", err.response?.data || err.message);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ CZP",
            error: err.response?.data || err.message,
        });
    }
};

// 3. Controller สำหรับ /api/notification
export const handleNotification = async (req, res) => { // ใช้ export const แทน exports.handleNotification = 
    try {
        const { appId, userId, token, message, sendDateTime } = req.body;

        if (!appId || !userId || !token) {
            return res.status(400).json({
                success: false,
                message: "Missing appId, userId, or token in request body",
            });
        }

        const result = await dgaService.pushNotification(
            appId, userId, token, message, sendDateTime
        );

        res.json({
            success: true,
            message: "ส่ง Notification สำเร็จ",
            result,
        });
    } catch (err) {
        console.error("💥 Notification Error:", err.response?.data || err.message);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการส่ง Notification",
            error: err.response?.data || err.message,
        });
    }
};

// 4. Controller สำหรับ /api/get-user-data
export const handleGetUserData = (req, res) => { // ใช้ export const แทน exports.handleGetUserData = 
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Unauthorized. No session data found.' });
    }
};

export const handleLogout = async (req, res) => {
    try {
        await logoutUser(req);
        // ล้าง Cookie (connect.sid คือชื่อ default ของ session cookie)
        res.clearCookie('connect.sid'); 
        res.json({ success: true, message: 'Logout successful.' });
    } catch (err) {
        console.error("💥 Logout Error:", err.message);
        res.status(500).json({ success: false, message: 'Failed to securely logout.', error: err.message });
    }
};