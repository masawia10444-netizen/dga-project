// services/dga.service.js
import axios from 'axios';
import 'dotenv/config'; // โหลด ENV

// สร้าง Axios Instance แยกไว้ใน Service
const axiosInstance = axios.create({
    timeout: 10000,
});

// กำหนด URL API DGA
const DGA_API = {
    VALIDATE: 'https://api.egov.go.th/ws/auth/validate',
    CZP_LOGIN: 'https://api.egov.go.th/ws/dga/czp/uat/v1/core/shield/data/deproc',
    NOTIFICATION: 'https://api.egov.go.th/ws/dga/czp/uat/v1/core/notification/push',
};

// --- ดึงค่า ENV และตรวจสอบ ---
const { AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET } = process.env;
if (!AGENT_ID || !CONSUMER_KEY || !CONSUMER_SECRET) {
    // throw Error เมื่อ Server รัน เพื่อหยุดการทำงานหากไม่มี Credential
    console.error('💥 FATAL: DGA credentials missing.');
    throw new Error('Missing Required DGA environment variables (AGENT_ID, CONSUMER_KEY, CONSUMER_SECRET) in .env file.');
}
const DGA_HEADERS = { "Consumer-Key": CONSUMER_KEY, "Content-Type": "application/json" };

// 1. Logic สำหรับการขอ Token (Validate)
export async function validateToken() {
    const url = `${DGA_API.VALIDATE}?ConsumerSecret=${CONSUMER_SECRET}&AgentID=${AGENT_ID}`;
    
    try {
        const response = await axiosInstance.get(url, { headers: DGA_HEADERS });
        if (!response.data.Result) {
            throw new Error("Invalid Token Response from DGA");
        }
        return response.data.Result; // คืนค่า Access Token
    } catch (error) {
        throw new Error(`DGA Validate API failed: ${error.response?.status || error.message}`);
    }
}

// 2. Logic สำหรับการขอข้อมูลผู้ใช้ (Login)
export async function getUserData(appId, mToken, token) {
    const headers = { ...DGA_HEADERS, Token: token };

    try {
        const response = await axiosInstance.post(
            DGA_API.CZP_LOGIN,
            { appId, mToken },
            { headers }
        );
        const result = response.data;
        
        if (result.messageCode !== 200) {
            throw new Error(result.message || "CZP API Error (Login)");
        }
        return result.result; // คืนค่าข้อมูลผู้ใช้
    } catch (error) {
        throw new Error(`CZP Login API failed: ${error.response?.status || error.message}`);
    }
}

// 3. Logic สำหรับการส่ง Notification
export async function pushNotification(appId, userId, token, message, sendDateTime = null) {
    const headers = { ...DGA_HEADERS, Token: token };
    const body = {
        appId: appId,
        data: [{ message: message || "ทดสอบข้อความ", userId: userId }],
        sendDateTime: sendDateTime,
    };

    try {
        const response = await axiosInstance.post(DGA_API.NOTIFICATION, body, { headers });
        return response.data;
    } catch (error) {
        throw new Error(`Notification API failed: ${error.response?.status || error.message}`);
    }
}