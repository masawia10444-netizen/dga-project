// controllers/dga.controller.js (CommonJS Syntax - MongoDB)

const axios = require("axios");
const User = require("../models/user.model"); // อ้างอิง User Model
require("dotenv").config();

const axiosInstance = axios.create({
    timeout: 10000,
});

// --- Controller Functions ---

/**
 * 1. Controller สำหรับ /api/validate
 * ⭐️ ปรับปรุงให้ใช้ DGA eGov Endpoint และ Header ตามรูปภาพล่าสุด ⭐️
 */
exports.validateToken = async (req, res) => {
    try {
        console.log("🚀 [START] /api/validate (DGA eGov)");

        const { AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET } = process.env;

        if (!AGENT_ID || !CONSUMER_KEY || !CONSUMER_SECRET) {
            throw new Error('Missing DGA environment variables.');
        }

        // 1. สร้าง Base URL
        const baseUrl = "https://api.egov.go.th/ws/auth/validate";
        
        // 2. สร้าง URL พร้อม Query Parameters (ConsumerSecret และ AgentID)
        const requestUrl = new URL(baseUrl);
        requestUrl.searchParams.append('ConsumerSecret', CONSUMER_SECRET); 
        requestUrl.searchParams.append('AgentID', AGENT_ID);

        // 3. กำหนด Headers (ใช้ Consumer-Key)
        const headers = {
            'Consumer-Key': CONSUMER_KEY, 
            'Content-Type': 'application/json',
        };

        console.log("🔗 Requesting:", requestUrl.toString());

        const response = await axiosInstance.get(requestUrl.toString(), {
            headers: headers,
        });

        // Response format is assumed to be { "Result": "..." } (ตัว R ใหญ่)
        if (!response.data.Result) throw new Error("Invalid Token Response (Missing 'Result' key)");

        const token = response.data.Result;
        
        console.log("✅ Validate success. Token:", token);

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

/**
 * 2. Controller สำหรับ /api/login (รวม Logic Mongoose Update)
 * ⚠️ Note: Endpoint นี้ยังคงเรียก DGA CZP เดิม
 */
exports.loginUser = async (req, res) => {
    try {
        console.log("🚀 [START] /api/login");
        const { appId, mToken, token } = req.body;

        if (!appId || !mToken || !token)
            return res.status(400).json({ success: false, message: "Missing appId, mToken, or token" });

        // API สำหรับ Login ยังใช้ DGA CZP เดิม
        const apiUrl = "https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc";

        const headers = {
            // ใช้ Consumer-Key ใน Header สำหรับ Login API เดิม
            "Consumer-Key": process.env.CONSUMER_KEY, 
            "Content-Type": "application/json",
            Token: token,
        };

        const response = await axiosInstance.post(
            apiUrl,
            { appId: appId, mToken: mToken },
            { headers }
        );

        const result = response.data;
        if (result.messageCode !== 200) throw new Error(result.message || "CZP API Error");

        const user = result.result;

        // ✅ Save/Update to MongoDB using Mongoose (ใช้ citizenId เป็น key หลัก)
        try {
            const updatedUser = await User.findOneAndUpdate(
                { citizenId: user.citizenId }, // ค้นหาด้วย citizenId
                {
                    userId: user.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    mobile: user.mobile,
                    email: user.email,
                },
                { upsert: true, new: true, runValidators: true } // ถ้าไม่เจอให้สร้างใหม่ (upsert)
            );
            console.log("💾 User data saved/updated in MongoDB:", updatedUser._id);
        } catch (dbErr) {
            console.warn("⚠️ MongoDB update error:", dbErr.message);
        }

        // ⭐️ Backend Stateless: ส่งข้อมูลผู้ใช้กลับทันที ⭐️
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

/**
 * 3. Controller สำหรับ /api/notification (โค้ดเหมือนเดิม)
 */
exports.sendNotification = async (req, res) => {
    // ... (โค้ดเหมือนเดิม) ...
    try {
        console.log("🚀 [START] /api/notification");

        const { appId, userId, token, message, sendDateTime } = req.body;
        if (!appId || !userId || !token)
            return res.status(400).json({ success: false, message: "Missing appId, userId, or token" });

        const Urlnoti = "https://api.egov.go.th/ws/dga/czp/uat/v1/core/notification/push";

        const headers = {
            "Consumer-Key": process.env.CONSUMER_KEY,
            "Content-Type": "application/json",
            Token: token,
        };

        const body = {
            appId: appId,
            data: [{ message: message || "ทดสอบข้อความ", userId }],
            sendDateTime: sendDateTime || null
        };

        const response = await axiosInstance.post(Urlnoti, body, { headers });
        const result = response.data;

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

/**
 * 4. Controller สำหรับ /api/logout (Stateless Logout)
 */
exports.logoutUser = (req, res) => {
    res.json({ success: true, message: 'Stateless logout successful.' });
};