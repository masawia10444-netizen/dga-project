require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 1040; 

app.use(cors());
app.use(express.json()); 

// (โค้ดเชื่อมต่อ MongoDB ... ถ้ายังใช้อยู่ก็เก็บไว้)
// ...

// --- ⭐️ API หลักสำหรับ "ทางรัฐ" Miniapp (ตามแผนภาพ) ⭐️ ---
// (รวมขั้นตอน Auth + Deproc ไว้ในที่เดียว)
app.post('/api/miniapp/login', async (req, res) => {
  
  // 1. ⭐️ รับ appId และ mToken ที่ "ทางรัฐ" ส่งมาให้ (จากรูปข้อ 2)
  const { appId, mToken } = req.body;
  if (!appId || !mToken) {
     return res.status(400).json({ error: 'appId and mToken are required' });
  }

  console.log("Miniapp Login: ได้รับ appId และ mToken");

  try {
    // 2. ⭐️ (หลังบ้าน) ขั้นตอน Auth เพื่อเอา "Token"
    console.log("Miniapp Login: (Step 1) กำลัง Auth...");
    const baseApi = process.env.BASE_API;
    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;
    const agentId = process.env.AGENT_ID;

    const authUrl = new URL(`${baseApi}/auth/validate`);
    authUrl.searchParams.append('ConsumerSecret', consumerSecret);
    authUrl.searchParams.append('AgentID', agentId); // 👈 (ตัว D ใหญ่)

    const authHeaders = { 'Consumer-Key': consumerKey, 'Content-Type': 'application/json' };

    // ยิง Auth
    const authResponse = await axios.get(authUrl.href, { headers: authHeaders });
    const token = authResponse.data?.Result || authResponse.data?.token || authResponse.data?.Token;

    if (!token) {
      console.error("Miniapp Login: Auth สำเร็จ แต่หา Token ไม่เจอ");
      return res.status(500).json({ step: 'auth', message: 'Auth OK but Token not found' });
    }
    console.log("Miniapp Login: (Step 1) ได้ Token แล้ว");


    // 3. ⭐️ (หลังบ้าน) ขั้นตอน Deproc เพื่อเอา "ข้อมูลจริง" (จากรูปข้อ 3)
    console.log("Miniapp Login: (Step 2) กำลัง Deproc...");
    const deprocUrl = 'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc';
    
    const deprocHeaders = {
      'Consumer-Key': consumerKey,
      'Content-Type': 'application/json',
      'Token': token // 👈 "Token" (จาก Auth)
    };
    
    const deprocBody = {
      "appId": appId,   // 👈 (ที่ "ทางรัฐ" ส่งมา)
      "mToken": mToken  // 👈 (ที่ "ทางรัฐ" ส่งมา)
    };

    // ยิง Deproc
    const deprocResponse = await axios.post(deprocUrl, deprocBody, { headers: deprocHeaders });

    // 4. ⭐️ ส่ง "ข้อมูลจริง" กลับไป (จากรูปข้อ 5)
    console.log("Miniapp Login: (Step 2) ได้ข้อมูลจริงแล้ว, ส่งกลับ");
    res.json(deprocResponse.data); // 👈 ส่งข้อมูลจริงกลับไปให้ "ทางรัฐ"

  } catch (error) {
    console.error("Miniapp Login: เกิด Error!", error.response?.data || error.message);
    res.status(500).json({ message: "Miniapp Login Failed", error: error.response?.data || error.message });
  }
});

app.post('/api/dga/send-notification', async (req, res) => {
  
  const { token, userId, message } = req.body;
  if (!token || !userId || !message) {
    return res.status(400).json({ message: "กรุณาส่ง token, userId, และ message" });
  }

  const baseApiEnv = process.env.BASE_API_ENV;
  const consumerKey = process.env.CONSUMER_KEY;
  const appId = process.env.T_APP_ID; 

  const pushUrl = `${baseApiEnv}/v1/core/notification/push`;
  
  const headers = {
    'Consumer-Key': consumerKey,
    'Content-Type': 'application/json',
    'Token': token
  };

  // --- ⭐️ ส่วนที่แก้ไข ตาม Specification ⭐️ ---
  const body = {
    "appId": appId, // 👈 1. แก้เป็น 'a' ตัวเล็ก
    "data": [       // 👈 2. แก้เป็น 'd' ตัวเล็ก และเป็น Array
      {
        "message": message, // 👈 3. แก้เป็น 'm' ตัวเล็ก
        "userId": userId    // 👈 4. แก้เป็น 'u' ตัวเล็ก
      }
    ]
    // "sendDateTime": null // (ถ้าไม่ใส่ = ส่งทันที)
  };
  // ------------------------------------------

  console.log("กำลังเรียก DGA /notification/push API (แก้ไขแล้ว)...");

  try {
    const response = await axios.post(pushUrl, body, { headers: headers });
    res.json(response.data);
  } catch (error) {
    console.error("เรียก DGA Push API ไม่สำเร็จ!", error.response?.data || error.message);
    res.status(500).json({ message: "เรียก DGA Push API ไม่สำเร็จ" });
  }
});

// --- ⭐️⭐️⭐️ จุดที่แก้ไข ⭐️⭐️⭐️ ---
const HOST = '0.0.0.0'; // 👈 1. เพิ่มบรรทัดนี้

// (app.listen อยู่ล่างสุด)
app.listen(port, HOST, () => { // 👈 2. เพิ่ม HOST เข้าไป
  // 3. แก้ไข log ให้อ้างอิง HOST (จะได้ไม่สับสน)
  console.log(`Back-end Server (Miniapp API) รันที่ http://${HOST}:${port}`); 
});