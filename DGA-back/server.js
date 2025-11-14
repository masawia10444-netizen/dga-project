import 'dotenv/config'; // ⭐️ เปลี่ยน
import express from 'express'; // ⭐️ เปลี่ยน
import cors from 'cors'; // ⭐️ เปลี่ยน
import axios from 'axios'; // ⭐️ เปลี่ยน

const app = express();
const port = process.env.PORT || 1040; 

// --- ⚙️ Middleware ---
app.use(cors());
app.use(express.json()); 

// --- ⭐️ API หลักสำหรับ "ทางรัฐ" Miniapp (Auth + Deproc) ⭐️ ---
app.post('/api/miniapp/login', async (req, res) => {
    
    let { appId, mToken } = req.body;

    // ⭐️ ดึงค่า Mock จาก .env ถ้า Frontend ไม่ได้ส่งมา
    const MOCK_APP_ID = process.env.T_APP_ID; 
    const MOCK_MTOKEN = process.env.T_MOCK_MTOKEN; 

    if (!appId) {
        appId = MOCK_APP_ID;
        console.log("Miniapp Login: ใช้ Mock AppId จาก .env");
    }
    if (!mToken) {
        mToken = MOCK_MTOKEN;
        console.log("Miniapp Login: ใช้ Mock mToken จาก .env");
    }

    if (!appId || !mToken) {
        return res.status(400).json({ error: 'appId and mToken are required in body or .env' });
    }

    console.log(`Miniapp Login: ใช้ AppId: ${appId}, mToken: ${mToken.substring(0, 10)}...`);

    try {
        // --- Step 1: Auth เพื่อเอา "Token" ---
        const baseApi = process.env.BASE_API;
        const consumerKey = process.env.CONSUMER_KEY;
        const consumerSecret = process.env.CONSUMER_SECRET;
        const agentId = process.env.AGENT_ID;

        const authUrl = new URL(`${baseApi}/auth/validate`);
        authUrl.searchParams.append('ConsumerSecret', consumerSecret);
        authUrl.searchParams.append('AgentID', agentId); 

        const authHeaders = { 'Consumer-Key': consumerKey, 'Content-Type': 'application/json' };

        const authResponse = await axios.get(authUrl.href, { headers: authHeaders });
        const token = authResponse.data?.Result || authResponse.data?.token || authResponse.data?.Token;

        if (!token) {
            console.error("Miniapp Login: Auth สำเร็จ แต่หา Token ไม่เจอ");
            return res.status(500).json({ step: 'auth', message: 'Auth OK but Token not found' });
        }
        console.log("Miniapp Login: (Step 1) ได้ Token แล้ว");

        // --- Step 2: Deproc เพื่อเอา "ข้อมูลจริง" ---
        const deprocUrl = 'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc';
        
        const deprocHeaders = {
            'Consumer-Key': consumerKey,
            'Content-Type': 'application/json',
            'Token': token 
        };
        
        const deprocBody = {
            "appId": appId,   
            "mToken": mToken  
        };

        const deprocResponse = await axios.post(deprocUrl, deprocBody, { headers: deprocHeaders });

        console.log("Miniapp Login: (Step 2) ได้ข้อมูลจริงแล้ว, ส่งกลับ");
        res.json(deprocResponse.data); 

    } catch (error) {
        console.error("Miniapp Login: เกิด Error!", error.response?.data || error.message);
        res.status(500).json({ message: "Miniapp Login Failed", error: error.response?.data || error.message });
    }
});


// --- ⭐️ API POST (Mock Data) ⭐️ ---
app.post('/api/dga/mock-data', async (req, res) => {
  
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "กรุณาส่ง Token (จากขั้นตอน Auth) มาด้วย" });
  }

  const baseApiEnv = process.env.BASE_API_ENV; 
  const consumerKey = process.env.CONSUMER_KEY;
  const appId = process.env.T_APP_ID; 

  const mockUrl = `${baseApiEnv}/v1/core/shield/data/mock`;
  
  const headers = {
    'Consumer-Key': consumerKey,
    'Content-Type': 'application/json',
    'Token': token 
  };

  const body = {
    "appId": appId,
    "citizenId": process.env.T_CITIZEN_ID,
    "firstName": process.env.T_FIRSTNAME,
    "lastName": process.env.T_LASTNAME,
    "datedBirthString": process.env.T_DOB,
    "mobile": process.env.T_MOBILE,
    "email": process.env.T_EMAIL,
    "userId": process.env.T_MOCK_USERID,
    "notification": (process.env.T_NOTIFICATION === 'true') 
  };

  console.log("กำลังเรียก DGA /mock-data API...");

  try {
    const response = await axios.post(mockUrl, body, { headers: headers });
    res.json(response.data);

  } catch (error) {
    console.error("เรียก DGA Mock API ไม่สำเร็จ!", error.response?.data || error.message);
    res.status(500).json({ message: "เรียก DGA Mock API ไม่สำเร็จ" });
  }
});

// --- 🚀 Server Start ---
app.listen(port, () => {
  console.log(`Back-end Server รันที่ http://localhost:${port}`); 
});