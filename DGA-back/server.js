// server.js (CommonJS Syntax - Monolithic Structure)
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const axios = require('axios'); // นำเข้า axios ที่นี่
require('dotenv').config();

const app = express();
// ใช้ Port 1040 ตาม .env ที่คุณกำหนด
const PORT = process.env.PORT || 1040;

const axiosInstance = axios.create({
  timeout: 10000,
});

// --- Middleware ---
// อนุญาตให้ Frontend (localhost:PORT อื่น) เข้าถึงได้ และอนุญาตให้ส่ง Cookie (Session) ข้ามโดเมนได้
app.use(cors({ origin: true, credentials: true })); 
app.use(express.json());

// ตั้งค่า Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 ชั่วโมง
  }
}));

// ตรวจสอบว่ามีตัวแปร ENV ที่จำเป็นสำหรับการเรียก API DGA หรือไม่
console.log("🔧 Loaded DGA ENV:", {
  AGENT_ID: process.env.AGENT_ID,
  CONSUMER_KEY: process.env.CONSUMER_KEY,
  CONSUMER_SECRET: process.env.CONSUMER_SECRET ? "✅" : "❌ MISSING",
});


// --- DGA API Endpoints (รวมจาก api.js เดิม) ---

/**
 * ✅ STEP 1: ขอ Token (Validate) จาก eGov 
 * Endpoint: GET /api/validate
 */
app.get("/api/validate", async (req, res) => {
  try {
    console.log("🚀 [START] /api/validate");

    const { AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET } = process.env;
    if (!AGENT_ID || !CONSUMER_KEY || !CONSUMER_SECRET) {
        throw new Error('Missing DGA environment variables in .env file (AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET).');
    }

    // URL สำหรับขอ Access Token 
    const url = `https://api.egov.go.th/ws/auth/validate?ConsumerSecret=${CONSUMER_SECRET}&AgentID=${AGENT_ID}`;

    console.log("🔗 Requesting:", url);

    const response = await axiosInstance.get(url, {
      headers: {
        "Consumer-Key": CONSUMER_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Validate success:", response.data);

    if (!response.data.Result) throw new Error("Invalid Token Response");

    res.json({
      success: true,
      token: response.data.Result,
    });
  } catch (err) {
    console.error("💥 Validate Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "การ Validate token ล้มเหลว",
      error: err.response?.data || err.message,
    });
  }
});

/**
 * ✅ STEP 2: ใช้ token + appId + mToken เพื่อขอข้อมูลผู้ใช้ (Login)
 * Endpoint: POST /api/login
 */
app.post("/api/login", async (req, res) => {
  try {
    console.log("🚀 [START] /api/login");
    const { appId, mToken, token } = req.body;

    if (!appId || !mToken || !token)
      return res
        .status(400)
        .json({ success: false, message: "Missing appId, mToken, or token" });

    // URL สำหรับขอข้อมูลผู้ใช้ (CZP Data)
    const apiUrl =
      "https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc";

    const headers = {
      "Consumer-Key": process.env.CONSUMER_KEY,
      "Content-Type": "application/json",
      Token: token,
    };

    console.log("🌐 [STEP] Calling DGA:", apiUrl);
    const response = await axiosInstance.post(
      apiUrl,
      { appId: appId, mToken: mToken },
      { headers }
    );

    const result = response.data;
    console.log("✅ DGA Response:", result);

    if (result.messageCode !== 200)
      throw new Error(result.message || "CZP API Error");

    const user = result.result;

    // บันทึกข้อมูลผู้ใช้ลงใน Session
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
});

/**
 * ✅ STEP 3: ส่ง Notification ไปยัง eGov (Notification Push)
 * Endpoint: POST /api/notification
 */
app.post("/api/notification", async (req, res) => {
  try {
    console.log("🚀 [START] /api/notification");

    // ดึงข้อมูลที่จำเป็นจาก body
    const { appId, userId, token, message, sendDateTime } = req.body;

    console.log("📥 Notification Request Body:", req.body);
    if (!appId || !userId || !token)
      return res.status(400).json({
        success: false,
        message: "Missing appId, userId, or token",
      });

    // URL สำหรับส่ง Notification
    const Urlnoti =
      "https://api.egov.go.th/ws/dga/czp/uat/v1/core/notification/push";

    // Header ตามคู่มือ DGA
    const headers = {
      "Consumer-Key": process.env.CONSUMER_KEY,
      "Content-Type": "application/json",
      Token: token,
    };

    // Body ตามรูปแบบที่ต้องการ (รองรับการส่งเดียว)
    const body = {
      appId: appId,
      data: [
        {
          message: message || "ทดสอบข้อความ", // ค่า default
          userId: userId,
        },
      ],
      sendDateTime: sendDateTime || null
    };

    console.log("🌐 [STEP] Calling DGA:", Urlnoti);
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    const response = await axiosInstance.post(Urlnoti, body, { headers });
    const result = response.data;

    console.log("✅ DGA Response:", result);

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
});


// --- Session Data Retrieval Endpoint ---
// Endpoint สำหรับดึงข้อมูลผู้ใช้จาก Session (Frontend จะเรียกใช้หลัง Login สำเร็จ)
app.get('/api/get-user-data', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user); // ส่งข้อมูลผู้ใช้ที่บันทึกไว้ใน Session
  } else {
    res.status(401).json({ error: 'Unauthorized. No session data found.' });
  }
});

// Endpoint ทดสอบสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
    res.send({ status: 'Server is running', api_path: '/api/validate' });
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});