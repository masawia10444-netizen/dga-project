// services/dga.service.js (ปรับปรุงแล้ว)
import axios from 'axios';
import 'dotenv/config'; 

// สร้าง Axios Instance
const axiosInstance = axios.create({
    timeout: 10000,
});

const DGA_API = {
    // ใช้ URL ตามภาพที่คุณส่งมา
    VALIDATE: 'https://api.egov.go.th/ws/auth/validate',
    // ... URLs อื่น ๆ (CZP_LOGIN, NOTIFICATION) ที่อาจมีในไฟล์นี้
};

// --- ดึงค่า ENV ---
// AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET ถูกกำหนดเป็น Required ตามภาพ
const { AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET } = process.env;
if (!AGENT_ID || !CONSUMER_KEY || !CONSUMER_SECRET) {
    // ปรับปรุงการแจ้งเตือนให้ชัดเจนขึ้น
    throw new Error('💥 ERROR: Missing Required DGA environment variables (AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET) in .env file.');
}

/**
 * 🚀 Logic สำหรับการขอ Access Token (Validate) จาก DGA
 * * @returns {string} Access Token สำหรับใช้เรียก API DGA อื่นๆ
 * @throws {Error} หากการเรียก API ล้มเหลวหรือ Token ไม่ถูกต้อง
 */
export async function validateToken() { 
    console.log("🔗 Requesting Access Token from DGA Validate API...");

    // 1. สร้าง URL พร้อม Query Parameters (ConsumerSecret และ AgentID)
    // ใช้ mToken ที่ถูกส่งมาจาก landing url (ถ้ามี) แทน AgentID ตามคำอธิบาย
    // แต่เพื่อความสอดคล้องกับโค้ดเดิมและภาพ API (ที่แสดง AgentID) จะใช้ AGENT_ID จาก .env
    const url = `${DGA_API.VALIDATE}?ConsumerSecret=${CONSUMER_SECRET}&AgentID=${AGENT_ID}`;

    try {
        // 2. เรียก API ด้วย Axios
        const response = await axiosInstance.get(url, {
            headers: {
                // Consumer-Key ถูกส่งใน Header
                "Consumer-Key": CONSUMER_KEY, 
                "Content-Type": "application/json",
            },
        });
        
        // 3. ตรวจสอบ Response Data (ตามภาพ Response คือมี Key ชื่อ "Result")
        if (!response.data || !response.data.Result) {
            // โยน Error หาก Response ไม่มี Key "Result" หรือ Response ไม่เป็นไปตามที่คาด
            throw new Error(`Invalid or missing Token 'Result' in DGA Response. Status: ${response.status}`);
        }

        console.log("✅ DGA Validate Success. Token retrieved.");
        return response.data.Result; // คืนค่า Access Token
        
    } catch (error) {
        // จัดการและส่ง Error กลับไปยัง Controller
        const errorData = error.response?.data || { message: error.message };
        console.error("💥 DGA Validate Error details:", errorData);
        // โยน Error ที่ชัดเจนกว่าเดิม
        throw new Error(`DGA API Validation failed: ${JSON.stringify(errorData)}`);
    }
}

