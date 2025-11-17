// src/components/DGALoginFlow.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ตั้งค่า axios instance สำหรับการเรียก API
const api = axios.create({
    // ใช้ Base URL /api ซึ่งจะถูก Proxy ไปยัง Backend (Port 1040)
    baseURL: '/api', 
    // สำคัญ: ต้องตั้งค่า withCredentials: true เพื่อให้ Session Cookie ทำงานได้
    withCredentials: true, 
    timeout: 15000,
});

// ข้อมูลจำลอง (Mock Data) ที่ใช้สำหรับการทดสอบ Login Flow
const MOCK_DATA = {
    appId: 'YOUR_DGA_APP_ID', // โปรดเปลี่ยนเป็น App ID จริงของคุณ
    mToken: 'mock_mtoken_from_landing_url', // ค่า mToken ที่ได้รับมาจาก DGA
};

function DGALoginFlow() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ------------------------------------------
    // 1. ตรวจสอบ Session เมื่อ Component โหลด
    // ------------------------------------------
    useEffect(() => {
        // ฟังก์ชันนี้ตรวจสอบว่ามีข้อมูลผู้ใช้ใน Session อยู่แล้วหรือไม่
        const checkSession = async () => {
            try {
                // เรียกใช้ Endpoint ที่เราสร้างไว้ใน Backend
                const response = await api.get('/get-user-data');
                // หาก Session ยังอยู่และมีข้อมูล
                setUser(response.data);
                setError(null);
            } catch (err) {
                // Session หมดอายุหรือไม่มีข้อมูล (401 Unauthorized)
                console.log('No active user session found.');
                setUser(null);
            }
        };

        checkSession();
    }, []);

    // ------------------------------------------
    // 2. Login Flow หลัก (Validate -> Login)
    // ------------------------------------------
    const handleLoginFlow = async () => {
        setLoading(true);
        setError(null);
        let validatedToken = null;

        try {
            // A. STEP 1: ขอ Token (Validate)
            console.log('Start Step 1: Requesting validation token...');
            const validateResponse = await api.get('/validate');
            
            validatedToken = validateResponse.data.token;
            setToken(validatedToken);
            console.log('✅ Token received: ' + validatedToken.substring(0, 10) + '...');

            // B. STEP 2: ใช้ Token และ mToken เพื่อขอข้อมูลผู้ใช้ (Login)
            console.log('Start Step 2: Requesting user data (CZP Login)...');
            const loginResponse = await api.post('/login', {
                appId: MOCK_DATA.appId,
                mToken: MOCK_DATA.mToken,
                token: validatedToken, // ส่ง Token ที่เพิ่งได้ไป
            });

            // ข้อมูลผู้ใช้ถูกบันทึกใน Session โดย Backend
            setUser(loginResponse.data.user);
            console.log('✅ Login successful. User data retrieved and saved to session.');

        } catch (err) {
            console.error('💥 DGA Login Flow Failed:', err);
            // ดึงข้อความ error ที่ชัดเจนที่สุดจาก Backend
            const message = err.response?.data?.message || err.message || 'Unknown error occurred.';
            setError(message);
            setUser(null); 
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------------------
    // 3. Render UI
    // ------------------------------------------
    return (
        <div className="dga-login-flow-container p-6 bg-white rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">DGA Login Flow (Client)</h2>

            {/* ส่วนแสดงสถานะและปุ่ม */}
            {!user ? (
                <>
                    <p className="text-gray-600 mb-4">สถานะ: รอการเข้าสู่ระบบ</p>
                    <button
                        onClick={handleLoginFlow}
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-200 
                            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {loading ? 'กำลังดำเนินการ...' : '🚀 Start DGA Login Flow'}
                    </button>
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            Error: {error}
                        </div>
                    )}
                </>
            ) : (
                // แสดงข้อมูลผู้ใช้เมื่อ Login สำเร็จ
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-800 rounded">
                    <h3 className="text-lg font-bold mb-2">✅ เข้าสู่ระบบสำเร็จ</h3>
                    <p>ชื่อ: **{user.citizenName || 'N/A'}**</p>
                    <p>เลขบัตร: **{user.citizenId || 'N/A'}**</p>
                    <p className="text-sm mt-2">ข้อมูลนี้ถูกดึงมาจาก Session ของ Backend</p>
                    <button
                        onClick={() => setUser(null)} // Reset state
                        className="mt-3 text-sm py-1 px-3 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                        Reset / Logout
                    </button>
                </div>
            )}
        </div>
    );
}

// ⭐️ สำคัญ: Default Export สำหรับ App.jsx
export default DGALoginFlow;