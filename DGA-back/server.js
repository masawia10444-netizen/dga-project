// server.js (ES Module Syntax)
import 'dotenv/config'; // สำหรับการโหลดตัวแปร .env
import express from 'express';
import session from 'express-session';
import axios from 'axios';
import cors from 'cors';

const app = express();
// ใช้ Port จาก .env หรือ default เป็น 1040
const PORT = process.env.PORT || 1040;

// --- Middleware Setup ---

// อนุญาตให้ Frontend สามารถเรียกใช้ API ได้
app.use(cors({ origin: true, credentials: true })); 
app.use(express.json());

// ตั้งค่า Session สำหรับเก็บข้อมูลผู้ใช้งานหลัง Login
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key', // คีย์ลับสำหรับเข้ารหัส session
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // ใช้ secure cookie ใน Production (ต้องใช้ HTTPS)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 ชั่วโมง
  }
}));


// --- 1. ฟังก์ชันขอ Token (สำหรับ Notification) ---

// ตัวแปรสำหรับเก็บ Token ไว้ใน Cache
let cachedDgaToken = null;
let tokenExpiryTime = 0; // เวลาที่ Token จะหมดอายุ (เป็นมิลลิวินาที)

/**
 * ฟังก์ชันสำหรับขอ Access Token จาก DGA API
 * และเก็บไว้ใน Cache 30 นาที
 * @returns {Promise<string>} DGA Access Token
 */
async function getDgaToken() {
  // 1. ตรวจสอบ Cache: ถ้า Token ยังไม่หมดอายุ ให้อัน Token ที่เก็บไว้
  if (cachedDgaToken && Date.now() < tokenExpiryTime) {
    console.log('[DGA Token] Using cached DGA Token...');
    return cachedDgaToken;
  }

  // 2. ถ้า Token หมดอายุ หรือยังไม่มี: ขอใหม่
  console.log('[DGA Token] Fetching new DGA Token...');
  const { DGA_AUTH_URL, DGA_CONSUMER_SECRET, DGA_AGENT_ID, DGA_CONSUMER_KEY } = process.env; 

  if (!DGA_AUTH_URL || !DGA_CONSUMER_SECRET || !DGA_AGENT_ID || !DGA_CONSUMER_KEY) { 
    throw new Error('Missing DGA Auth environment variables.');
  }

  // สร้าง URL พร้อม Query Parameters
  const authUrl = `${DGA_AUTH_URL}?ConsumerSecret=${DGA_CONSUMER_SECRET}&AgentID=${DGA_AGENT_ID}`;

  try {
    const response = await axios.get(authUrl, {
      headers: {
        'Consumer-Key': DGA_CONSUMER_KEY, 
        'ConsumerSecret': DGA_CONSUMER_SECRET, // อาจไม่จำเป็นต้องใส่ แต่ใส่ไว้เพื่อความมั่นใจ
        'Content-Type': 'application/json'
      }
    });

    const token = response.data?.Result;
    if (!token) {
      throw new Error(`Failed to get Token from DGA, Result is empty: ${JSON.stringify(response.data)}`);
    }

    // 3. เก็บ Token ใหม่ลง Cache (30 นาที = 1,800,000 มิลลิวินาที)
    cachedDgaToken = token;
    tokenExpiryTime = Date.now() + 1800000; 

    console.log('[DGA Token] New DGA Token fetched and cached. Expires in 30 mins.');
    return token;

  } catch (error) {
    const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('[DGA Token] Error fetching DGA Token:', errorDetail);
    throw new Error(`Could not retrieve DGA Access Token. Details: ${errorDetail}`);
  }
}


// --- 2. API Endpoints (Login Flow) ---

/**
 * NEW Endpoint: รับ Token สำหรับ Notification (ขั้นตอน [1] ในโค้ดอ้างอิง)
 * Endpoint: /test5/api/validate
 * - ทำหน้าที่: จำลองการ Validate เพื่อดึง Token สำหรับใช้ในการเรียก API ขั้นต่อไป
 * - ตอบกลับ: { token: string }
 */
app.get('/test5/api/validate', async (req, res) => {
  console.log('[Validate] Requesting DGA Token...');
  try {
    const token = await getDgaToken();
    res.json({ success: true, token: token });
  } catch (error) {
    console.error('[Validate] Failed to get token:', error.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve DGA Token for validation.' });
  }
});

/**
 * Endpoint ที่ 1: รับ AppID และ mToken จาก Frontend (Login)
 * Endpoint: /test5/api/login
 * - ทำหน้าที่: เรียก DGA API เพื่อตรวจสอบ mToken และดึงข้อมูลผู้ใช้
 * - ผลลัพธ์: เก็บข้อมูลผู้ใช้ลงใน Session
 */
app.post('/test5/api/login', async (req, res) => {
  // โค้ดที่อ้างอิงมีการส่ง 'token' (DGA Access Token) มาด้วย แต่โค้ดนี้จะใช้ Token ใหม่เสมอสำหรับ Notification
  const { appId, mToken } = req.body; 
  if (!appId || !mToken) {
    return res.status(400).json({ error: 'AppID and mToken are required.' });
  }
  
  const DGA_USER_AUTH_API_URL = process.env.DGA_USER_AUTH_API_URL; 
  if (!DGA_USER_AUTH_API_URL) {
    return res.status(500).json({ error: 'DGA User Auth API URL is not configured.' });
  }

  try {
    // เรียก DGA API (ขั้นตอนที่ 4)
    const response = await axios.post(DGA_USER_AUTH_API_URL, { appId, mToken });
    
    // บันทึกข้อมูลลง Session (ขั้นตอนที่ 5)
    req.session.user = response.data;
    console.log(`[Login] User logged in: ${response.data?.userid}`);
    
    res.json({ success: true, message: 'Login successful', user: response.data }); // เพิ่ม user: response.data เพื่อให้ตรงกับโค้ดอ้างอิง
  } catch (error) {
    const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('[Login] Error calling DGA API:', errorDetail);
    res.status(500).json({ error: 'Failed to retrieve user data from DGA API.' });
  }
});

/**
 * Endpoint ที่ 2: ให้ Frontend เรียกใช้เพื่อดึงข้อมูลจาก Session
 * Endpoint: /test5/api/get-user-data
 * - ทำหน้าที่: เป็นจุดตรวจสอบสถานะ Login ของผู้ใช้
 */
app.get('/test5/api/get-user-data', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Unauthorized. No session data found.' });
  }
});


// --- 3. ฟังก์ชันและ Endpoints (Notification Flow) ---

/**
 * ฟังก์ชันหลักสำหรับส่ง Notification ไปยัง DGA API
 * - รองรับการส่งสูงสุด 1000 รายการต่อครั้ง
 * - รองรับการตั้งเวลาส่ง (sendDateTime)
 * @param {Array<{message: string, userId: string}>} notifications - รายการแจ้งเตือน
 * @param {string | null} [sendDateTime=null] - เวลาส่งที่กำหนด เช่น "2025-11-15T09:00:00+07:00"
 */
async function sendDgaNotification(notifications, sendDateTime = null) {
  // 1. ดึงค่า Config และ Token
  const {
    DGA_NOTI_API_URL,
    DGA_APP_ID,
    DGA_CONSUMER_KEY
  } = process.env;
  
  if (!notifications || notifications.length === 0) {
    throw new Error('Notifications array cannot be empty.');
  }
  if (notifications.length > 1000) {
    throw new Error('Cannot send more than 1000 notifications per batch.');
  }

  const dgaToken = await getDgaToken();

  if (!DGA_NOTI_API_URL || !DGA_APP_ID || !DGA_CONSUMER_KEY || !dgaToken) {
    throw new Error('Missing required DGA Notification environment variables or Token.');
  }

  // 2. สร้าง Request Body (ตรงตาม Spec)
  const requestBody = {
    appId: DGA_APP_ID,
    data: notifications,
    sendDateTime: sendDateTime // จะเป็น null หรือ string ก็ได้
  };

  // 3. สร้าง Request Headers (ตรงตาม Spec)
  const requestHeaders = {
    'Consumer-Key': DGA_CONSUMER_KEY,
    'Token': dgaToken,
    'Content-Type': 'application/json'
  };

  // 4. เรียก API
  try {
    console.log(`[Notification] Sending ${notifications.length} notification(s)...`);
    const response = await axios.post(DGA_NOTI_API_URL, requestBody, {
      headers: requestHeaders
    });
    console.log('[Notification] DGA response received:', response.data);
    return response.data; 
  } catch (error) {
    const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('[Notification] Error sending DGA notification:', errorDetail);
    
    // ตรวจสอบและล้าง Token Cache หากเกิด 401 (Token หมดอายุ)
    if (error.response && error.response.status === 401) {
      console.log('[Notification] Received 401. Token might be expired. Clearing cache...');
      cachedDgaToken = null; 
      tokenExpiryTime = 0;
    }
    
    throw error.response ? error.response.data : new Error(`Failed to send notification. Details: ${errorDetail}`);
  }
}

/**
 * NEW Endpoint: ส่ง Notification เดี่ยว (ตรงตามโค้ดอ้างอิง)
 * Endpoint: /test5/api/notification
 * - ทำหน้าที่: รองรับการส่ง Notification ทันที (ขั้นตอน [4] ในโค้ดอ้างอิง)
 * - รับ userId และ message จาก request body
 */
app.post('/test5/api/notification', async (req, res) => {
  try {
    // 1. ดึงข้อมูลที่จำเป็นจาก request body
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ success: false, error: 'userId and message are required.' });
    }

    // 2. สร้าง Data
    const notifications = [{ message: message, userId: userId }];

    // 3. ส่งข้อความ (null = ส่งทันที)
    const dgaResponse = await sendDgaNotification(notifications, null); 
    
    // 4. ตอบกลับ
    res.json({ success: true, message: 'Notification sent successfully.', ...dgaResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error.' });
  }
});

/**
 * ตัวอย่าง 1: ส่ง Notification เดี่ยว (ส่งทันที)
 * (ชื่อเดิม /send-single-noti ยังคงอยู่เป็นตัวอย่าง)
 * - รับ userId และ message จาก request body
 */
app.post('/send-single-noti', async (req, res) => {
  try {
    // 1. สมมติว่าได้รับ userId และ message จาก Frontend
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ success: false, error: 'userId and message are required.' });
    }

    // 2. สร้าง Data
    const notifications = [{ message: message, userId: userId }];

    // 3. ส่งข้อความ (null = ส่งทันที)
    const dgaResponse = await sendDgaNotification(notifications, null); 
    
    // 4. ตอบกลับ
    res.json({ success: true, message: 'Notification sent immediately.', ...dgaResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error.' });
  }
});


/**
 * ตัวอย่าง 2: ส่ง Notification แบบตั้งเวลาเป็นชุด
 * - จำลองการดึงรายชื่อผู้ใช้และส่งรายงานประจำเดือน
 */
app.post('/send-monthly-report-noti', async (req, res) => {
  try {
    // 1. จำลองการดึง UserID จาก Miniapp Database
    const allUserIds = ["user-id-001", "user-id-002", "user-id-003"];

    const notifications = allUserIds.map(uid => ({
      message: "รายงานสรุปประจำเดือนของคุณมาแล้ว! กดเพื่อดูรายละเอียด",
      userId: uid
    }));

    // 2. ตั้งเวลาส่ง (ตัวอย่าง: 9 โมงเช้าของวันที่ 15 พ.ย. 2025)
    const scheduledTime = "2025-11-15T09:00:00+07:00"; // Format YYYY-MM-DDTHH:MM:SS+07:00

    // 3. ส่งข้อความ
    const dgaResponse = await sendDgaNotification(notifications, scheduledTime);

    res.json({ success: true, message: "Scheduled notifications successfully.", ...dgaResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Internal server error.' });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // สั่งให้ดึง Token มาเก็บไว้เลยตอนเริ่มเซิร์ฟเวอร์
  console.log('Pre-fetching DGA Token on server start...');
  getDgaToken().catch(err => {
    console.error('Failed to pre-fetch DGA Token on start:', err.message);
  });
});