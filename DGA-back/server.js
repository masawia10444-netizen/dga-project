// api.js (Express Router - CommonJS Syntax)
const express = require("express");
const router = express.Router();
const axios = require("axios");
// Note: ถ้าคุณต้องการใช้ database (เช่น PostgreSQL) ให้เปิด comment บรรทัดนี้
// และติดตั้ง dependency รวมถึงกำหนดค่า pool ให้เรียบร้อย
// const { pool } = require("../db"); 
require("dotenv").config();

// 🔧 ตรวจสอบว่ามีตัวแปร ENV ที่จำเป็นสำหรับการเรียก API DGA หรือไม่
console.log("🔧 Loaded DGA ENV:", {
  AGENT_ID: process.env.AGENT_ID,
  CONSUMER_KEY: process.env.CONSUMER_KEY,
  CONSUMER_SECRET: process.env.CONSUMER_SECRET ? "✅" : "❌ MISSING",
});

const axiosInstance = axios.create({
  timeout: 10000,
});

/**
 * ✅ STEP 1: ขอ Token (Validate) จาก eGov 
 * (ใช้แทน getDgaToken() เดิม)
 * Endpoint: GET /api/validate
 * Output: { success: true, token: "..." }
 */
router.get("/validate", async (req, res) => {
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
 * ต้องส่ง: { appId, mToken, token }
 */
router.post("/login", async (req, res) => {
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

    // ---------------------------------------------------------------------
    // ✅ Placeholder: บันทึกข้อมูลผู้ใช้ลงฐานข้อมูล (Database Save)
    /*
    try {
      await pool.query(
        `INSERT INTO "User" (userId, citizenId, firstname, lastname, mobile, email)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (citizenId) DO UPDATE
         SET firstname = EXCLUDED.firstname,
             lastname = EXCLUDED.lastname,
             mobile = EXCLUDED.mobile,
             email = EXCLUDED.email;`,
        [ user.userId, user.citizenId, user.firstName, user.lastName, user.mobile, user.email, ]
      );
      console.log("💾 User saved successfully to DB");
    } catch (dbErr) {
      console.warn("⚠️ Database insert warning (Missing pool?):", dbErr.message);
    }
    */
    // ---------------------------------------------------------------------

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
 * (ใช้แทน sendDgaNotification() เดิม)
 * Endpoint: POST /api/notification
 * ต้องส่ง: { appId, userId, token, message, sendDateTime (optional) }
 */
router.post("/notification", async (req, res) => {
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

module.exports = router;