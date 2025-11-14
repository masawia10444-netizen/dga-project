import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import axios from 'axios';
import cors from 'cors'; // ⭐️ เปิดกลับมาใช้
// ⭐️ ไม่ต้องใช้ path หรือ fileURLToPath แล้ว
// import path from 'path'; 
// import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 1040;

// --- Middleware ---
// ⭐️⭐️ เปิด CORS ⭐️⭐️
// เพื่ออนุญาตให้ Frontend (ที่ Port 80) เรียกหา Backend (ที่ Port 1040)
app.use(cors({
  origin: true, // หรือระบุ Domain จริง เช่น 'https://czp-staging.biza.me'
  credentials: true
}));

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

// --- ⭐️ ไม่ต้องมี Serve Frontend (React) แล้ว ---
// app.use(express.static(path.join(__dirname, 'public')));


// --- 1. ฟังก์ชันขอ Token (สำหรับ Notification) ---
let cachedDgaToken = null;
let tokenExpiryTime = 0;

async function getDgaToken() {
  if (cachedDgaToken && Date.now() < tokenExpiryTime) {
    console.log('Using cached DGA Token...');
    return cachedDgaToken;
  }

  console.log('Fetching new DGA Token...');
  const { DGA_AUTH_URL, DGA_CONSUMER_SECRET, DGA_AGENT_ID } = process.env;

  if (!DGA_AUTH_URL || !DGA_CONSUMER_SECRET || !DGA_AGENT_ID) {
    throw new Error('Missing Auth environment variables.');
  }

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

    cachedDgaToken = token;
    tokenExpiryTime = Date.now() + 1800000; // 30 นาที
    console.log('New DGA Token fetched and cached.');
    return token;

  } catch (error) {
    console.error('Error fetching DGA Token:', error.response ? error.response.data : error.message);
    throw new Error('Could not retrieve DGA Access Token.');
  }
}

// --- 2. ฟังก์ชันส่ง Notification ---
async function sendDgaNotification(notifications, sendDateTime = null) {
  const {
    DGA_NOTI_API_URL,
    DGA_APP_ID,
    DGA_CONSUMER_KEY
  } = process.env;
  
  const dgaToken = await getDgaToken();

  if (!notifications || notifications.length === 0) {
    throw new Error('Notifications array cannot be empty.');
  }
  if (notifications.length > 1000) {
    throw new Error('Cannot send more than 1000 notifications per batch.');
  }
  if (!DGA_NOTI_API_URL || !DGA_APP_ID || !DGA_CONSUMER_KEY || !dgaToken) {
    throw new Error('Missing required DGA Notification environment variables or Token.');
  }

  const requestBody = {
    appId: DGA_APP_ID,
    data: notifications,
    sendDateTime: sendDateTime
  };

  const requestHeaders = {
    'Consumer-Key': DGA_CONSUMER_KEY,
    'Token': dgaToken,
    'Content-Type': 'application/json'
  };

  try {
    console.log(`Sending ${notifications.length} notification(s)...`);
    const response = await axios.post(DGA_NOTI_API_URL, requestBody, {
      headers: requestHeaders
    });
    console.log('DGA Notification sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending DGA notification:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      cachedDgaToken = null; 
      tokenExpiryTime = 0;
    }
    throw error.response ? error.response.data : new Error('Failed to send notification to DGA API.');
  }
}

// --- 3. Endpoints ของ API (⭐️ ไม่มี /api ⭐️) ---

app.post('/profile/login', async (req, res) => {
  const { appId, mToken } = req.body;
  if (!appId || !mToken) {
    return res.status(400).json({ error: 'AppID and mToken are required.' });
  }
  const DGA_API_URL = process.env.DGA_API_URL;
  try {
    const response = await axios.post(DGA_API_URL, { appId, mToken });
    req.session.user = response.data;
    console.log('User data stored in session.');
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Error calling DGA API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to retrieve data from DGA API.' });
  }
});

app.get('/get-user-data', async (req, res) => { // ⭐️ ชื่อ Endpoint ผิด ต้องเป็น /get-user-data
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Unauthorized. No session data found.' });
  }
});

app.post('/send-single-noti', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const notifications = [{ message: message, userId: userId }];
    const dgaResponse = await sendDgaNotification(notifications, null);
    res.json({ success: true, ...dgaResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/send-monthly-report-noti', async (req, res) => {
  try {
    const allUserIds = ["user-id-001", "user-id-002", "user-id-003"]; // (สมมติ)
    const notifications = allUserIds.map(uid => ({
      message: "รายงานสรุปประจำเดือนของคุณมาแล้ว!",
      userId: uid
    }));
    const scheduledTime = "2025-11-15T09:00:00+07:00";
    const dgaResponse = await sendDgaNotification(notifications, scheduledTime);
    res.json({ success: true, message: "Scheduled notifications successfully.", ...dgaResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- ⭐️ ไม่ต้องมี Catch-All Route แล้ว ---
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server (Backend API Only) is running on http://localhost:${PORT}`);
  // ⭐️ สั่งให้ดึง Token มาเก็บไว้เลยตอนเริ่มเซิร์ฟเวอร์
  console.log('Pre-fetching DGA Token on server start...');
  getDgaToken().catch(err => {
    console.error('Failed to pre-fetch DGA Token on start:', err.message);
  });
});