// server.js (ES Module Syntax)
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import axios from 'axios';
import cors from 'cors';

const app = express();
// ⭐️ ใช้ Port 1040 ตาม .env ที่คุณกำหนด
const PORT = process.env.PORT || 1040;

// --- Middleware ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
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

// --- 1. ฟังก์ชันขอ Token (สำหรับ Notification) ---

// ตัวแปรสำหรับเก็บ Token ไว้ใน Cache
let cachedDgaToken = null;
let tokenExpiryTime = 0; // เวลาที่ Token จะหมดอายุ

/**
 * ฟังก์ชันสำหรับขอ Access Token จาก DGA API
 * และเก็บไว้ใน Cache 30 นาที
 */
async function getDgaToken() {
  // 1. ตรวจสอบ Cache
  if (cachedDgaToken && Date.now() < tokenExpiryTime) {
    console.log('Using cached DGA Token...');
    return cachedDgaToken;
  }

  // 2. ถ้า Token หมดอายุ หรือยังไม่มี: ขอใหม่
  console.log('Fetching new DGA Token...');
  const { DGA_AUTH_URL, DGA_CONSUMER_SECRET, DGA_AGENT_ID } = process.env;

  if (!DGA_AUTH_URL || !DGA_CONSUMER_SECRET || !DGA_AGENT_ID) {
    throw new Error('Missing Auth environment variables.');
  }

  // สร้าง URL พร้อม Query Parameters
  const authUrl = `${DGA_AUTH_URL}?ConsumerSecret=${DGA_CONSUMER_SECRET}&AgentID=${DGA_AGENT_ID}`;

  try {
    const response = await axios.get(authUrl, {
      headers: {
        'ConsumerSecret': DGA_CONSUMER_SECRET,
        'Content-Type': 'application/json'
      }
    });

    const token = response.data.Result;
    if (!token) {
      throw new Error('Failed to get Token from DGA, "Result" is empty.');
    }

    // 3. เก็บ Token ใหม่ลง Cache (30 นาที)
    cachedDgaToken = token;
    tokenExpiryTime = Date.now() + 1800000; 

    console.log('New DGA Token fetched and cached.');
    return token;

  } catch (error) {
    console.error('Error fetching DGA Token:', error.response ? error.response.data : error.message);
    throw new Error('Could not retrieve DGA Access Token.');
  }
}


// --- 2. API Endpoints (Login Flow) ---

/**
 * Endpoint ที่ 1: รับ AppID และ mToken จาก Frontend (Login)
 */
app.post('/profile/login', async (req, res) => {
  const { appId, mToken } = req.body;
  if (!appId || !mToken) {
    return res.status(400).json({ error: 'AppID and mToken are required.' });
  }
  const DGA_API_URL = process.env.DGA_API_URL;
  try {
    const response = await axios.post(DGA_API_URL, { appId, mToken });
    
    // ขั้นตอนที่ 5: บันทึกข้อมูลลง Session
    req.session.user = response.data;
    console.log('User data stored in session.');
    
    // (เพิ่มเติม) ขั้นตอนที่ 6: บันทึกข้อมูลลง Miniapp Database
    // ในขั้นตอนนี้ คุณควรจะดึงข้อมูล (เช่น response.data.userid)
    // ไปบันทึกลง MongoDB ของคุณด้วย
    // await YourUserModel.save(response.data);
    
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Error calling DGA API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to retrieve data from DGA API.' });
  }
});

/**
 * Endpoint ที่ 2: ให้ Frontend เรียกใช้เพื่อดึงข้อมูลจาก Session
 */
app.get('/api/get-user-data', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Unauthorized. No session data found.' });
  }
});


// --- 3. ฟังก์ชันและ Endpoints (Notification Flow) ---

/**
 * ฟังก์ชันสำหรับส่ง Notification
 * (ตรงตาม Spec ในรูปทั้งหมด)
 */
async function sendDgaNotification(notifications, sendDateTime = null) {
  // 1. ดึงค่า Config
  const {
    DGA_NOTI_API_URL,
    DGA_APP_ID,
    DGA_CONSUMER_KEY
  } = process.env;
  
  // 2. ดึง Token อัตโนมัติ
  const dgaToken = await getDgaToken();

  // 3. ตรวจสอบ Input (ตรงตาม Limit 1000 ในรูป)
  if (!notifications || notifications.length === 0) {
    throw new Error('Notifications array cannot be empty.');
  }
  if (notifications.length > 1000) {
    throw new Error('Cannot send more than 1000 notifications per batch.');
  }
  if (!DGA_NOTI_API_URL || !DGA_APP_ID || !DGA_CONSUMER_KEY || !dgaToken) {
    throw new Error('Missing required DGA Notification environment variables or Token.');
  }

  // 4. สร้าง Request Body (ตรงตาม Spec)
  const requestBody = {
    appId: DGA_APP_ID,
    data: notifications,
    sendDateTime: sendDateTime
  };

  // 5. สร้าง Request Headers (ตรงตาม Spec)
  const requestHeaders = {
    'Consumer-Key': DGA_CONSUMER_KEY,
    'Token': dgaToken,
    'Content-Type': 'application/json'
  };

  // 6. เรียก API
  try {
    console.log(`Sending ${notifications.length} notification(s)...`);
    const response = await axios.post(DGA_NOTI_API_URL, requestBody, {
      headers: requestHeaders
    });
    console.log('DGA Notification sent successfully:', response.data);
    return response.data; // (ผลลัพธ์คือ { result: [...] })
  } catch (error) {
    console.error('Error sending DGA notification:', error.response ? error.response.data : error.message);
    
    if (error.response && error.response.status === 401) {
      console.log('Token might be expired. Clearing cache...');
      cachedDgaToken = null; 
      tokenExpiryTime = 0;
    }
    
    throw error.response ? error.response.data : new Error('Failed to send notification to DGA API.');
  }
}

/**
 * ตัวอย่าง 1: ส่ง Notification เดี่ยว (ส่งทันที)
 * (ตรงตาม Workflow 'Send Notification (Single)')
 */
app.post('/send-single-noti', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    // 1. Miniapp Backend (ขั้นตอนนี้คือการดึง userId จาก DB/Session)
    // สมมติว่าได้ userId มาจาก req.body
    // const user = await YourUserModel.findOne( ... );

    // 2. สร้าง Data
    const notifications = [{ message: message, userId: userId }];

    // 3. ส่งข้อความ
    const dgaResponse = await sendDgaNotification(notifications, null); // null = ส่งทันที
    
    // 4. ตอบกลับ
    res.json({ success: true, ...dgaResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


/**
 * ตัวอย่าง 2: ส่ง Notification แบบตั้งเวลา
 * (ตรงตาม Workflow 'Send Notification (Batch with Schedule)')
 */
app.post('/send-monthly-report-noti', async (req, res) => {
  try {
    // 1. (สมมติ) ต้องการส่งให้ 3 คน
    // 2. ดึงข้อมูล UserID จาก Miniapp Database
    const allUserIds = ["user-id-001", "user-id-002", "user-id-003"];

    const notifications = allUserIds.map(uid => ({
      message: "รายงานสรุปประจำเดือนของคุณมาแล้ว!",
      userId: uid
    }));

    // 3. ตั้งเวลาส่ง (เช่น 9 โมงเช้า)
    const scheduledTime = "2025-11-15T09:00:00+07:00"; // Format YYYY-MM-DDTHH:MM:SS+07:00

    // 4. ส่งข้อความ
    const dgaResponse = await sendDgaNotification(notifications, scheduledTime);

    res.json({ success: true, message: "Scheduled notifications successfully.", ...dgaResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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