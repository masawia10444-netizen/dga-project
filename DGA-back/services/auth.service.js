// AuthService.js

// ⭐️ ข้อมูลที่จะใช้ในการยืนยันตัวตน (ควรดึงมาจาก .env หรือ Config ใน Production)
// อ้างอิงจากค่าใน .env ที่เคยส่งมา: DGA_CONSUMER_KEY_NOTI, DGA_AGENT_ID_AUTH, DGA_CONSUMER_SECRET_AUTH
const DGA_CREDENTIALS = {
    // ต้องเป็นค่าเดียวกับที่ Backend (auth.service.js) คาดหวัง
    ConsumerKey: '9e5c84d2-a51b-4686-b8a6-e52782a792b6', 
    AgentID: '8a816448-0207-45f4-8613-65b0ad80afdb',   
    ConsumerSecret: 'fXEBc3LZ-3r',                     
};

/**
 * @desc เรียก API เพื่อขอ Access Token
 * @returns {string} Access Token
 */
export async function validateToken() {
    const { ConsumerKey, AgentID, ConsumerSecret } = DGA_CREDENTIALS;

    // ⭐️ ใช้ Relative Path ที่มี Prefix /api เพื่อให้ Vite Proxy ทำงาน (ตามที่ตั้งค่าใน vite.config.js)
    // Backend กำหนด Route เป็น /api/auth/validate
    const url = `/api/auth/validate?Consumer-Key=${ConsumerKey}&AgentID=${AgentID}`; 

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // ส่ง ConsumerSecret ผ่าน Header ตาม Spec
                'ConsumerSecret': ConsumerSecret, 
                'Content-Type': 'application/json',
                // ไม่ต้องระบุ Authorization เพราะ Request นี้เป็นการขอ Token
            },
        });

        // ตรวจสอบสถานะ HTTP
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const accessToken = data.Result; 

        // ⭐️ จัดเก็บ Token
        localStorage.setItem('dga_access_token', accessToken);
        
        return accessToken;

    } catch (error) {
        console.error("Error during Token Validation:", error.message);
        throw error;
    }
}

/**
 * @desc ตัวอย่างการเรียก API ที่ต้องใช้ Token (เช่น /api/dga/data)
 */
export async function getProtectedData() {
    const token = localStorage.getItem('dga_access_token');

    if (!token) {
        throw new Error("No access token found. Please log in first.");
    }

    const url = `/api/dga/data`; // ใช้ Relative Path และ Prefix /api

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            // ⭐️ แนบ Token ใน Header แบบ Bearer เพื่อส่งไปให้ auth.middleware.js ตรวจสอบ
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch protected data. Status: ${response.status}`);
    }

    return response.json();
}