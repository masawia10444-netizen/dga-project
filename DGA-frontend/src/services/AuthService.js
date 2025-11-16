// AuthService.js

// ⭐️ สำคัญ: Base URL ของ Backend ที่รันบน Docker
// ถ้า Frontend รันบน 8083 และ Backend รันบน 1040 
// ใน Dev Environment ควรชี้ไปที่ Host (localhost)
const API_BASE_URL = 'http://localhost:1040'; 

// ⭐️ ข้อมูลที่จะใช้ในการยืนยันตัวตน (ควรดึงมาจาก .env หรือ Config ใน Production)
const DGA_CREDENTIALS = {
    ConsumerKey: '9e5c84d2-a51b-4686-b8a6-e52782a792b6', // อ้างอิงจาก .env DGA_CONSUMER_KEY_NOTI
    AgentID: '8a816448-0207-45f4-8613-65b0ad80afdb',   // อ้างอิงจาก .env DGA_AGENT_ID_AUTH
    ConsumerSecret: 'fXEBc3LZ-3r',                     // อ้างอิงจาก .env DGA_CONSUMER_SECRET_AUTH
};

/**
 * @desc เรียก API เพื่อขอ Access Token
 * @returns {string} Access Token
 */
export async function validateToken() {
    const { ConsumerKey, AgentID, ConsumerSecret } = DGA_CREDENTIALS;

    const url = `${API_BASE_URL}/auth/validate?Consumer-Key=${ConsumerKey}&AgentID=${AgentID}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // ส่ง ConsumerSecret ผ่าน Header ตาม Spec
                'ConsumerSecret': ConsumerSecret, 
                'Content-Type': 'application/json',
            },
        });

        // ตรวจสอบสถานะ HTTP
        if (!response.ok) {
            // ถ้าไม่สำเร็จ เช่น 401 Unauthorized
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
 * @desc ตัวอย่างการเรียก API ที่ต้องใช้ Token
 */
export async function getProtectedData() {
    const token = localStorage.getItem('dga_access_token');

    if (!token) {
        throw new Error("No access token found. Please log in first.");
    }

    const url = `${API_BASE_URL}/dga/data`; // สมมติว่ามี API นี้

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            // ⭐️ แนบ Token ใน Header แบบ Bearer
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch protected data. Status: ${response.status}`);
    }

    return response.json();
}